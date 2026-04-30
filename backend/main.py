from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import os
import shutil
import datetime
from datetime import timezone, timedelta
import asyncio
import threading
import random
import string
import bcrypt 

# NAYA: HTTP Requests ke liye imports (Brevo API ke liye)
import urllib.request
import json

import models
from database import engine, get_db, SessionLocal

otp_store = {}

def get_password_hash(password: str):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str):
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="Stranger Link API")

os.makedirs("uploads", exist_ok=True)
app.mount("/static_uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://stranger-link-one.vercel.app",
        "https://stranger-link-kfr1.onrender.com"
    ],
    allow_origin_regex=r"https://.*\.vercel\.app", 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

IST = timezone(timedelta(hours=5, minutes=30))
def get_ist_now():
    return datetime.datetime.now(IST)

# NAYA: Brevo API Email Sender (Render safe)
def send_otp_email(receiver_email: str, otp: str):
    api_key = os.getenv("BREVO_API_KEY")
    sender_email = os.getenv("EMAIL_SENDER", "rootannymous469@gmail.com")
    
    if not api_key:
        print(f"\n[DEV MODE] OTP for {receiver_email}: {otp}\n")
        return 
        
    url = "https://api.brevo.com/v3/smtp/email"
    payload = {
        "sender": {"name": "StrangerLink", "email": sender_email},
        "to": [{"email": receiver_email}],
        "subject": "Your StrangerLink Verification Code",
        "textContent": f"Hello!\n\nYour verification code is: {otp}\n\nThis code will expire in 10 minutes.\n\nWelcome to StrangerLink!"
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("accept", "application/json")
    req.add_header("api-key", api_key)
    req.add_header("content-type", "application/json")
    
    try:
        with urllib.request.urlopen(req) as response:
            print(f"OTP Email sent successfully to {receiver_email}")
    except Exception as e:
        print(f"Brevo Email Error: {e}")

def delete_physical_file(file_url: str):
    if not file_url:
        return
    try:
        filename = file_url.split("/")[-1]
        file_path = os.path.join("uploads", filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Deleted physical file: {file_path}")
    except Exception as e:
        print(f"Error deleting file: {e}")

def perform_hard_delete(db: Session, email: str):
    posts = db.query(models.Post).filter(models.Post.user_email == email).all()
    for p in posts:
        delete_physical_file(p.image_url)
    
    messages = db.query(models.Message).filter(models.Message.sender_email == email).all()
    for m in messages:
        if m.media_url and "uploads/" in m.media_url and m.type != "media":
            delete_physical_file(m.media_url)

    db.query(models.Post).filter(models.Post.user_email == email).delete()
    db.query(models.PostLike).filter(models.PostLike.user_email == email).delete()
    db.query(models.Comment).filter(models.Comment.user_email == email).delete()
    db.query(models.UserFollow).filter((models.UserFollow.follower_email == email) | (models.UserFollow.following_email == email)).delete()
    db.query(models.Notification).filter((models.Notification.user_email == email) | (models.Notification.from_email == email)).delete()
    db.query(models.Message).filter(models.Message.sender_email == email).delete()
    db.query(models.ChatSession).filter((models.ChatSession.user1_email == email) | (models.ChatSession.user2_email == email)).delete()
    db.query(models.UserBlock).filter((models.UserBlock.blocker_email == email) | (models.UserBlock.blocked_email == email)).delete()
    
    db.query(models.User).filter(models.User.email == email).delete()
    db.commit()

def run_background_tasks():
    db = SessionLocal()
    try:
        now = get_ist_now()
        
        threshold_time = now - timedelta(hours=48)
        old_media_messages = db.query(models.Message).filter(
            models.Message.created_date <= threshold_time,
            models.Message.media_url != None,
            models.Message.type.in_(["image", "audio"]) 
        ).all()

        media_count = 0
        for msg in old_media_messages:
            if "uploads/" in msg.media_url:
                delete_physical_file(msg.media_url)
                msg.media_url = None
                msg.type = "text"
                msg.content = "Media expired"
                media_count += 1

        expired_vips = db.query(models.User).filter(
            models.User.is_vip == True,
            models.User.vip_expiry != None,
            models.User.vip_expiry <= now
        ).all()

        vip_count = 0
        for user in expired_vips:
            user.is_vip = False
            user.vip_expiry = None
            user.total_likes = max(0, user.total_likes - 50)
            vip_count += 1
            
        deactivate_threshold = now - timedelta(days=7)
        doomed_users = db.query(models.User).filter(
            models.User.deactivated == True,
            models.User.deactivated_date != None,
            models.User.deactivated_date <= deactivate_threshold
        ).all()
        
        doomed_count = len(doomed_users)
        for u in doomed_users:
            perform_hard_delete(db, u.email)

        if media_count > 0 or vip_count > 0 or doomed_count > 0:
            db.commit()
            print(f"Background Job: Media Removed: {media_count} | VIP Downgraded: {vip_count} | Auto-Deleted Accounts: {doomed_count}")
            
    except Exception as e:
        print(f"Background Job Error: {e}")
    finally:
        db.close()

async def start_cron_job():
    while True:
        threading.Thread(target=run_background_tasks).start()
        await asyncio.sleep(3600)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(start_cron_job())

def send_bytes_range_requests(file_path: str, start: int, end: int, chunk_size: int = 100 * 1024 * 1024):
    with open(file_path, "rb") as f:
        f.seek(start)
        while (pos := f.tell()) <= end:
            read_size = min(chunk_size, end + 1 - pos)
            yield f.read(read_size)

@app.get("/uploads/{filename}")
def serve_media(request: Request, filename: str):
    file_path = f"uploads/{filename}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    file_size = os.path.getsize(file_path)
    range_header = request.headers.get("range")
    
    if not str(filename).lower().endswith(('.mp4', '.mov', '.webm', '.ogg')) or not range_header:
        with open(file_path, "rb") as f:
            content = f.read()
        return StreamingResponse(iter([content]), media_type="application/octet-stream")

    byte1, byte2 = 0, None
    match = range_header.split("=")[1].split("-")
    byte1 = int(match[0])
    if match[1]:
        byte2 = int(match[1])
    else:
        byte2 = file_size - 1

    length = byte2 - byte1 + 1

    media_type = "video/mp4"
    if filename.endswith(".webm"): media_type = "video/webm"
    elif filename.endswith(".ogg"): media_type = "video/ogg"

    headers = {
        "Content-Range": f"bytes {byte1}-{byte2}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(length),
    }

    return StreamingResponse(
        send_bytes_range_requests(file_path, byte1, byte2),
        status_code=206,
        headers=headers,
        media_type=media_type
    )

def get_current_user(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header.split(" ")[1] 
    user = db.query(models.User).filter(models.User.email == token).first()
    if not user: raise HTTPException(status_code=401, detail="User not found")
    return user

@app.post("/api/auth/login")
def login(payload: dict, db: Session = Depends(get_db)):
    identifier = payload.get("identifier") 
    password = payload.get("password")
    
    if not identifier or not password:
        raise HTTPException(status_code=400, detail="Missing credentials")
        
    user = db.query(models.User).filter((models.User.email == identifier) | (models.User.username == identifier)).first()
    
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username/email or password")
        
    if user.deactivated:
        user.deactivated = False
        user.deactivated_date = None
        db.commit()
        
    return {"access_token": user.email, "user": user}

@app.post("/api/auth/send_otp")
def send_otp(payload: dict, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    email = payload.get("email")
    username = payload.get("username")
    
    if not email or not username:
        raise HTTPException(status_code=400, detail="Email and Username required")
        
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="Email is already registered")
    if db.query(models.User).filter(models.User.username == username).first():
        raise HTTPException(status_code=400, detail="Username is already taken")
        
    otp = ''.join(random.choices(string.digits, k=6))
    otp_store[email] = {
        "otp": otp,
        "expiry": get_ist_now() + timedelta(minutes=10)
    }
    
    # Background task for sending email to prevent blocking
    background_tasks.add_task(send_otp_email, email, otp)
    return {"message": "OTP sent successfully"}

@app.post("/api/auth/register")
def register(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email")
    username = payload.get("username")
    password = payload.get("password")
    otp = payload.get("otp")
    
    if not email or not username or not password or not otp:
        raise HTTPException(status_code=400, detail="Incomplete data. OTP missing.")
        
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="Email is already registered")
    if db.query(models.User).filter(models.User.username == username).first():
        raise HTTPException(status_code=400, detail="Username is already taken")
        
    stored_otp_data = otp_store.get(email)
    if not stored_otp_data:
        raise HTTPException(status_code=400, detail="OTP not requested or expired.")
    if stored_otp_data["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid Verification Code.")
    if get_ist_now() > stored_otp_data["expiry"]:
        del otp_store[email]
        raise HTTPException(status_code=400, detail="OTP has expired. Request a new one.")
        
    del otp_store[email]
        
    hashed_pw = get_password_hash(password)
    
    dob_str = payload.get("dob")
    dob_date = None
    if dob_str:
        try:
            dob_date = datetime.datetime.strptime(dob_str, "%Y-%m-%d").date()
        except ValueError:
            pass 
            
    new_user = models.User(
        email=email,
        username=username,
        full_name=payload.get("full_name", username),
        password_hash=hashed_pw,
        dob=dob_date,
        account_type="public",
        created_date=get_ist_now()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"access_token": new_user.email, "user": new_user}


# ==========================================
# 🚀 NAYA: FORGOT PASSWORD & RESET ROUTES
# ==========================================
# ==========================================
# 🚀 NAYA: FORGOT PASSWORD & RESET ROUTES
# ==========================================

@app.post("/api/auth/forgot-password-otp")
def forgot_password_otp(payload: dict, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    identifier = payload.get("identifier")
    
    if not identifier:
        raise HTTPException(status_code=400, detail="Email or Username required")
        
    user = db.query(models.User).filter(
        (models.User.email == identifier) | (models.User.username == identifier)
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Account not found with this email/username")
        
    otp = ''.join(random.choices(string.digits, k=6))
    otp_store[user.email] = {
        "otp": otp,
        "expiry": get_ist_now() + timedelta(minutes=10)
    }
    
    background_tasks.add_task(send_otp_email, user.email, otp)
    
    # 🚀 NAYA: MASK THE EMAIL FOR PRIVACY
    email_parts = user.email.split('@')
    masked_email = user.email
    if len(email_parts) == 2:
        name_part = email_parts[0]
        domain_part = email_parts[1]
        if len(name_part) > 2:
            masked_email = f"{name_part[0]}{'*' * (len(name_part)-2)}{name_part}@{domain_part}"
        else:
            masked_email = f"{name_part[0]}*@{domain_part}"

    # Return the masked email in the response
    return {"message": "Reset OTP sent to registered email", "masked_email": masked_email}

# (Baki ka code jaise reset_password same rahega)
@app.post("/api/auth/reset-password")
def reset_password(payload: dict, db: Session = Depends(get_db)):
    identifier = payload.get("identifier")
    otp = payload.get("otp")
    new_password = payload.get("new_password")
    
    if not identifier or not otp or not new_password:
        raise HTTPException(status_code=400, detail="Missing required fields")
        
    user = db.query(models.User).filter(
        (models.User.email == identifier) | (models.User.username == identifier)
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    stored_otp_data = otp_store.get(user.email)
    if not stored_otp_data:
        raise HTTPException(status_code=400, detail="OTP not requested or expired.")
    if stored_otp_data["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid Verification Code.")
    if get_ist_now() > stored_otp_data["expiry"]:
        del otp_store[user.email]
        raise HTTPException(status_code=400, detail="OTP has expired. Request a new one.")
        
    # Hash new password and update
    hashed_pw = get_password_hash(new_password)
    user.password_hash = hashed_pw
    db.commit()
    
    # Clear OTP from memory
    del otp_store[user.email]
    
    return {"message": "Password reset successfully"}

@app.post("/api/auth/firebase_login")
def firebase_login(payload: dict, db: Session = Depends(get_db)):
     email = payload.get("email")
     full_name = payload.get("full_name", "Stranger")
     
     if not email:
         raise HTTPException(status_code=400, detail="Missing email from Google")
         
     user = db.query(models.User).filter(models.User.email == email).first()
     
     if not user:
         base_username = email.split("@")[0][:8].lower()
         random_suffix = ''.join(random.choices(string.digits, k=4))
         new_username = f"{base_username}_{random_suffix}"
         
         while db.query(models.User).filter(models.User.username == new_username).first():
             new_username = f"{base_username}_{''.join(random.choices(string.digits, k=4))}"
             
         user = models.User(
             email=email,
             username=new_username,
             full_name=full_name,
             account_type="public",
             created_date=get_ist_now()
         )
         db.add(user)
         db.commit()
         db.refresh(user)
         
     if user.deactivated:
        user.deactivated = False
        user.deactivated_date = None
        db.commit()
        
     return {"access_token": user.email, "user": user}

@app.get("/api/auth/me")
def get_me(user: models.User = Depends(get_current_user)): return user

@app.put("/api/auth/me")
def update_me(payload: dict, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    for key, value in payload.items(): setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user

@app.delete("/api/auth/me")
def delete_or_deactivate_account(mode: str = "deactivate", db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    if mode == "delete":
        perform_hard_delete(db, user.email)
        return {"status": "account_deleted"}
    else:
        user.deactivated = True
        user.deactivated_date = get_ist_now()
        db.commit()
        return {"status": "account_deactivated"}

@app.get("/api/users")
def get_users(email: str = None, db: Session = Depends(get_db)):
    query = db.query(models.User)
    query = query.filter(models.User.deactivated == False)
    
    if email: query = query.filter(models.User.email == email)
    return query.all()

@app.put("/api/users/{id}")
def update_user_by_id(id: int, payload: dict, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == id).first()
    if user:
        for k, v in payload.items(): setattr(user, k, v)
        db.commit()
    return user

@app.post("/api/vip-payments")
def create_vip_payment(payload: dict, db: Session = Depends(get_db)):
    user_email = payload.get("user_email")
    plan = payload.get("plan")
    months = 2 if plan == "discounted_69" else 1

    payment = models.VIPPayment(**payload, created_date=get_ist_now())
    db.add(payment)
    
    user = db.query(models.User).filter(models.User.email == user_email).first()
    if user:
        user.is_vip = True
        now = get_ist_now()
        user.vip_expiry = now + timedelta(days=(30 * months))
        
        if not user.received_vip_bonus:
            user.total_likes += 100
            user.received_vip_bonus = True

    db.commit()
    return {"status": "success", "vip_expiry": user.vip_expiry}

@app.get("/api/chat-sessions")
def get_chat_sessions(id: int = None, status: str = None, mode: str = None, db: Session = Depends(get_db)):
    query = db.query(models.ChatSession)
    if id: query = query.filter(models.ChatSession.id == id)
    if status: query = query.filter(models.ChatSession.status == status)
    if mode: query = query.filter(models.ChatSession.mode == mode)
    return query.all()

@app.post("/api/chat-sessions")
def create_chat_session(payload: dict, db: Session = Depends(get_db)):
    session = models.ChatSession(**payload, created_date=get_ist_now())
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@app.put("/api/chat-sessions/{id}")
def update_chat_session(id: int, payload: dict, db: Session = Depends(get_db)):
    session = db.query(models.ChatSession).filter(models.ChatSession.id == id).first()
    if not session: raise HTTPException(status_code=404, detail="Not found")
    for k, v in payload.items(): setattr(session, k, v)
    db.commit()
    db.refresh(session)
    return session

@app.get("/api/messages")
def get_messages(session_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Message)
    if session_id: query = query.filter(models.Message.session_id == session_id)
    return query.order_by(models.Message.created_date.asc()).all()

@app.post("/api/messages")
def create_message(payload: dict, db: Session = Depends(get_db)):
    msg = models.Message(**payload, created_date=get_ist_now())
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

@app.put("/api/messages/{id}")
def update_message(id: int, payload: dict, db: Session = Depends(get_db)):
    msg = db.query(models.Message).filter(models.Message.id == id).first()
    if msg:
        for k, v in payload.items(): setattr(msg, k, v)
        db.commit()
        db.refresh(msg)
    return msg

@app.get("/api/notifications")
def get_notifications(user_email: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Notification)
    if user_email: query = query.filter(models.Notification.user_email == user_email)
    return query.order_by(models.Notification.created_date.desc()).all()

@app.post("/api/notifications")
def create_notification(payload: dict, db: Session = Depends(get_db)):
    notif = models.Notification(**payload, created_date=get_ist_now())
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

@app.put("/api/notifications/{id}")
def update_notification(id: int, payload: dict, db: Session = Depends(get_db)):
    notif = db.query(models.Notification).filter(models.Notification.id == id).first()
    if notif:
        for k, v in payload.items(): setattr(notif, k, v)
        db.commit()
    return notif

@app.delete("/api/notifications/{id}")
def delete_notification(id: int, db: Session = Depends(get_db)):
    notif = db.query(models.Notification).filter(models.Notification.id == id).first()
    if notif:
        db.delete(notif)
        db.commit()
    return {"status": "deleted"}

@app.delete("/api/notifications")
def delete_all_notifications(user_email: str, db: Session = Depends(get_db)):
    db.query(models.Notification).filter(models.Notification.user_email == user_email).delete()
    db.commit()
    return {"status": "all deleted"}

@app.get("/api/user-follows")
def get_user_follows(follower_email: str = None, following_email: str = None, status: str = None, db: Session = Depends(get_db)):
    query = db.query(models.UserFollow)
    
    deactivated_users = db.query(models.User.email).filter(models.User.deactivated == True).all()
    deactivated_emails = [row[0] for row in deactivated_users]
    
    if follower_email: query = query.filter(models.UserFollow.follower_email == follower_email)
    if following_email: query = query.filter(models.UserFollow.following_email == following_email)
    if status: query = query.filter(models.UserFollow.status == status)
    
    if deactivated_emails:
        query = query.filter(~models.UserFollow.follower_email.in_(deactivated_emails))
        query = query.filter(~models.UserFollow.following_email.in_(deactivated_emails))
        
    return query.all()

@app.post("/api/user-follows")
def create_user_follow(payload: dict, db: Session = Depends(get_db)):
    follower_email = payload.get("follower_email")
    following_email = payload.get("following_email")

    db.query(models.UserFollow).filter(
        models.UserFollow.follower_email == follower_email,
        models.UserFollow.following_email == following_email
    ).delete(synchronize_session=False)

    db.query(models.Notification).filter(
        models.Notification.user_email == following_email,
        models.Notification.from_email == follower_email,
        models.Notification.type.in_(['follow', 'follow_request'])
    ).delete(synchronize_session=False)

    target_user = db.query(models.User).filter(models.User.email == following_email).first()
    target_account_type = target_user.account_type if target_user and target_user.account_type else "public"
    
    follow_status = "pending" if target_account_type.lower() == "private" else "accepted"
    
    follow = models.UserFollow(
        follower_email=follower_email,
        following_email=following_email,
        follower_name=payload.get("follower_name"),
        following_name=payload.get("following_name"),
        status=follow_status,
        created_date=get_ist_now()
    )
    db.add(follow)

    notif = models.Notification(
        user_email=following_email,
        type="follow" if follow_status == "accepted" else "follow_request",
        title="New Follower" if follow_status == "accepted" else "Follow Request",
        content=f"{payload.get('follower_name')} started following you." if follow_status == "accepted" else f"{payload.get('follower_name')} requested to follow you.",
        from_email=follower_email,
        from_name=payload.get("follower_name"),
        created_date=get_ist_now()
    )
    db.add(notif)
    db.commit()
    db.refresh(follow)
    return follow

@app.put("/api/user-follows/{id}")
def update_user_follow(id: int, payload: dict, db: Session = Depends(get_db)):
    follow = db.query(models.UserFollow).filter(models.UserFollow.id == id).first()
    if follow:
        for k, v in payload.items(): setattr(follow, k, v)
        db.commit()
        db.refresh(follow)
    return follow

@app.delete("/api/user-follows/{id}")
def delete_user_follow(id: int, db: Session = Depends(get_db)):
    follow = db.query(models.UserFollow).filter(models.UserFollow.id == id).first()
    if follow:
        db.delete(follow)
        db.commit()
    return {"status": "deleted"}

@app.delete("/api/user-follows/remove-follower")
def delete_follower(my_email: str, follower_email: str, remove_following: str = "false", user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.email != my_email: raise HTTPException(status_code=403, detail="Unauthorized")
    db.query(models.UserFollow).filter(models.UserFollow.following_email == my_email, models.UserFollow.follower_email == follower_email).delete(synchronize_session=False)
    if remove_following.lower() == "true":
        db.query(models.UserFollow).filter(models.UserFollow.follower_email == my_email, models.UserFollow.following_email == follower_email).delete(synchronize_session=False)
    db.commit()
    return {"status": "deleted"}

@app.get("/api/posts")
def get_posts(user_email: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Post)
    
    deactivated_users = db.query(models.User.email).filter(models.User.deactivated == True).all()
    deactivated_emails = [row[0] for row in deactivated_users]
    if deactivated_emails:
        query = query.filter(~models.Post.user_email.in_(deactivated_emails))

    if user_email: query = query.filter(models.Post.user_email == user_email)
    return query.order_by(models.Post.created_date.desc()).all()

@app.post("/api/posts")
def create_post(payload: dict, db: Session = Depends(get_db)):
    post = models.Post(**payload, created_date=get_ist_now())
    db.add(post)
    db.commit()
    db.refresh(post)
    return post

@app.delete("/api/posts/{post_id}")
def delete_post(post_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post: raise HTTPException(status_code=404, detail="Not found")
    if post.user_email != user.email: raise HTTPException(status_code=403, detail="Unauthorized")
    
    delete_physical_file(post.image_url)

    db.query(models.PostLike).filter(models.PostLike.post_id == post_id).delete()
    db.query(models.Comment).filter(models.Comment.post_id == post_id).delete()
    db.delete(post)
    db.commit()
    return {"status": "deleted"}

@app.post("/api/posts/{post_id}/like")
def toggle_post_like(post_id: int, payload: dict, db: Session = Depends(get_db)):
    user_email = payload.get("user_email")
    user_name = payload.get("user_name", "Someone")
    existing_like = db.query(models.PostLike).filter(models.PostLike.post_id == post_id, models.PostLike.user_email == user_email).first()
    
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post: raise HTTPException(status_code=404, detail="Post not found")

    action = "unliked"
    if existing_like:
        db.delete(existing_like)
        post.likes_count = max(0, post.likes_count - 1)
    else:
        new_like = models.PostLike(post_id=post_id, user_email=user_email, created_date=get_ist_now())
        db.add(new_like)
        post.likes_count += 1
        action = "liked"
        
        if post.user_email != user_email:
            notif = models.Notification(
                user_email=post.user_email,
                type="like",
                title="New Like",
                content=f"{user_name} liked your post.",
                from_email=user_email,
                from_name=user_name,
                created_date=get_ist_now()
            )
            db.add(notif)

    db.commit()
    return {"status": action, "likes_count": post.likes_count}

@app.get("/api/posts/{post_id}/likes")
def get_post_likes(post_id: int, db: Session = Depends(get_db)):
    likes = db.query(models.PostLike).filter(models.PostLike.post_id == post_id).all()
    return [l.user_email for l in likes]

@app.get("/api/posts/{post_id}/comments")
def get_post_comments(post_id: int, db: Session = Depends(get_db)):
    comments = db.query(models.Comment).filter(models.Comment.post_id == post_id).order_by(models.Comment.created_date.asc()).all()
    return comments

@app.post("/api/posts/{post_id}/comments")
def add_post_comment(post_id: int, payload: dict, db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post: raise HTTPException(status_code=404)

    comment = models.Comment(
        post_id=post_id,
        user_email=payload.get("user_email"),
        user_name=payload.get("user_name"),
        text=payload.get("text"),
        created_date=get_ist_now()
    )
    db.add(comment)
    post.comments_count += 1

    if post.user_email != payload.get("user_email"):
        notif = models.Notification(
            user_email=post.user_email,
            type="comment",
            title="New Comment",
            content=f"{payload.get('user_name')} commented: {payload.get('text')}",
            from_email=payload.get("user_email"),
            from_name=payload.get("user_name"),
            created_date=get_ist_now()
        )
        db.add(notif)

    db.commit()
    db.refresh(comment)
    return comment

@app.post("/api/posts/{post_id}/share")
def share_post(post_id: int, payload: dict, db: Session = Depends(get_db)):
    sender_email = payload.get("sender_email")
    sender_name = payload.get("sender_name")
    receiver_email = payload.get("receiver_email")
    
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post: raise HTTPException(status_code=404, detail="Post not found")
    
    post.shares_count += 1
    
    session = db.query(models.ChatSession).filter(
        ((models.ChatSession.user1_email == sender_email) & (models.ChatSession.user2_email == receiver_email)) |
        ((models.ChatSession.user1_email == receiver_email) & (models.ChatSession.user2_email == sender_email))
    ).first()
    
    if not session:
        receiver = db.query(models.User).filter(models.User.email == receiver_email).first()
        sender = db.query(models.User).filter(models.User.email == sender_email).first()
        session = models.ChatSession(
            user1_email=sender_email, user1_name=sender.full_name, user1_gender=sender.gender,
            user2_email=receiver_email, user2_name=receiver.full_name if receiver else "User", user2_gender=receiver.gender if receiver else None,
            status="active",
            created_date=get_ist_now()
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
    media_type = "video" if str(post.image_url).lower().endswith(('.mp4', '.mov', '.webm', '.ogg')) else "image"
    msg = models.Message(
        session_id=session.id,
        sender_email=sender_email,
        sender_name=sender_name,
        content="Shared a post",
        type="media", 
        media_url=post.image_url,
        media_type=media_type,
        created_date=get_ist_now()
    )
    db.add(msg)
    
    if post.user_email != sender_email:
        notif = models.Notification(
            user_email=post.user_email,
            type="share",
            title="Post Shared",
            content=f"{sender_name} shared your post.",
            from_email=sender_email,
            from_name=sender_name,
            created_date=get_ist_now()
        )
        db.add(notif)
        
    db.commit()
    return {"status": "shared", "shares_count": post.shares_count}

@app.post("/api/upload")
def upload_file(request: Request, file: UploadFile = File(...)):
    file_location = f"uploads/{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    base_url = str(request.base_url).rstrip("/")
    return {"file_url": f"{base_url}/uploads/{file.filename}"}

@app.delete("/api/messages/{id}")
def delete_message(id: int, db: Session = Depends(get_db)):
    msg = db.query(models.Message).filter(models.Message.id == id).first()
    if msg:
        if msg.media_url and "uploads/" in msg.media_url and msg.type != "media":
             delete_physical_file(msg.media_url)

        msg.is_deleted = True
        db.commit()
    return {"status": "deleted"}

@app.put("/api/messages/read/{session_id}")
def mark_messages_read(session_id: int, payload: dict, db: Session = Depends(get_db)):
    user_email = payload.get("email") 
    msgs = db.query(models.Message).filter(
        models.Message.session_id == session_id, 
        models.Message.sender_email != user_email, 
        models.Message.is_read == False
    ).all()
    for m in msgs: m.is_read = True
    db.commit()
    return {"status": "updated"}

@app.delete("/api/chat-sessions/{id}")
def delete_chat_session(id: int, db: Session = Depends(get_db)):
    session = db.query(models.ChatSession).filter(models.ChatSession.id == id).first()
    if session:
        msgs = db.query(models.Message).filter(models.Message.session_id == id).all()
        for m in msgs:
            if m.media_url and "uploads/" in m.media_url and m.type != "media":
                delete_physical_file(m.media_url)
                
        db.query(models.Message).filter(models.Message.session_id == id).delete()
        db.delete(session)
        db.commit()
    return {"status": "deleted"}

@app.get("/api/blocks")
def get_blocks(blocker_email: str = None, db: Session = Depends(get_db)):
    query = db.query(models.UserBlock)
    if blocker_email: query = query.filter(models.UserBlock.blocker_email == blocker_email)
    return query.all()

@app.post("/api/blocks")
def block_user(payload: dict, db: Session = Depends(get_db)):
    block = models.UserBlock(
        blocker_email=payload.get("blocker_email"),
        blocked_email=payload.get("blocked_email"),
        created_date=get_ist_now()
    )
    db.add(block)
    
    if payload.get("delete_chat") and payload.get("session_id"):
        session_id = payload.get("session_id")
        
        msgs = db.query(models.Message).filter(models.Message.session_id == session_id).all()
        for m in msgs:
            if m.media_url and "uploads/" in m.media_url and m.type != "media":
                delete_physical_file(m.media_url)

        db.query(models.Message).filter(models.Message.session_id == session_id).delete()
        
        session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
        if session:
            if session.user1_email == payload.get("blocker_email"): session.saved_by_user1 = False
            else: session.saved_by_user2 = False

    db.commit()
    return block

@app.delete("/api/blocks/{id}")
def unblock_user(id: int, db: Session = Depends(get_db)):
    block = db.query(models.UserBlock).filter(models.UserBlock.id == id).first()
    if block:
        db.delete(block)
        db.commit()
        
    return {"status": "unblocked"}