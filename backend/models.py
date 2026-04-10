from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Date
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String, default="Stranger")
    
    # NAYA: Added for Custom Authentication and Personal Details
    password_hash = Column(String, nullable=True) 
    dob = Column(Date, nullable=True)
    show_personal_details = Column(Boolean, default=False)
    
    gender = Column(String, nullable=True)
    is_vip = Column(Boolean, default=False)
    vip_expiry = Column(DateTime(timezone=True), nullable=True) 
    received_vip_bonus = Column(Boolean, default=False) 
    total_likes = Column(Integer, default=0)
    matches_used_today = Column(Integer, default=0)
    last_match_reset = Column(String, nullable=True)
    account_type = Column(String, default="public")
    bio = Column(String, nullable=True)
    website = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    deactivated = Column(Boolean, default=False)
    deactivated_date = Column(DateTime(timezone=True), nullable=True)
    role = Column(String, default="user")
    created_date = Column(DateTime(timezone=True), server_default=func.now())

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user1_email = Column(String, index=True)
    user1_name = Column(String)
    user1_gender = Column(String, nullable=True)
    user2_email = Column(String, index=True, nullable=True)
    user2_name = Column(String, nullable=True)
    user2_gender = Column(String, nullable=True)
    status = Column(String, default="waiting") 
    mode = Column(String, default="text")
    gender_preference = Column(String, default="any")
    saved_by_user1 = Column(Boolean, default=False)
    saved_by_user2 = Column(Boolean, default=False)
    created_date = Column(DateTime(timezone=True), server_default=func.now())

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, index=True)
    sender_email = Column(String)
    sender_name = Column(String)
    content = Column(String)
    type = Column(String, default="text") 
    media_url = Column(String, nullable=True)
    media_type = Column(String, nullable=True) 
    is_read = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    created_date = Column(DateTime(timezone=True), server_default=func.now())

class ChatLike(Base):
    __tablename__ = "chat_likes"
    id = Column(Integer, primary_key=True, index=True)
    liker_email = Column(String, index=True)
    liked_email = Column(String, index=True)
    session_id = Column(Integer)
    created_date = Column(DateTime(timezone=True), server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    type = Column(String) 
    title = Column(String, nullable=True)
    content = Column(String)
    from_email = Column(String, nullable=True)
    from_name = Column(String, nullable=True)
    read = Column(Boolean, default=False)
    created_date = Column(DateTime(timezone=True), server_default=func.now())

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    user_name = Column(String)
    caption = Column(String, nullable=True)
    image_url = Column(String)
    type = Column(String, default="post")
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)  
    created_date = Column(DateTime(timezone=True), server_default=func.now())

class PostLike(Base):
    __tablename__ = "post_likes"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, index=True)
    user_email = Column(String, index=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, index=True)
    user_email = Column(String, index=True)
    user_name = Column(String)
    text = Column(String)
    created_date = Column(DateTime(timezone=True), server_default=func.now())

class UserFollow(Base):
    __tablename__ = "user_follows"
    id = Column(Integer, primary_key=True, index=True)
    follower_email = Column(String, index=True)
    following_email = Column(String, index=True)
    follower_name = Column(String, nullable=True)
    following_name = Column(String, nullable=True)
    status = Column(String, default="pending") 
    created_date = Column(DateTime(timezone=True), server_default=func.now())

class VIPPayment(Base):
    __tablename__ = "vip_payments"
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    user_name = Column(String)
    amount = Column(Float)
    transaction_id = Column(String, unique=True)
    status = Column(String, default="pending") 
    plan = Column(String)
    months = Column(Integer, default=1)
    created_date = Column(DateTime(timezone=True), server_default=func.now())

class UserBlock(Base):
    __tablename__ = "user_blocks"
    id = Column(Integer, primary_key=True, index=True)
    blocker_email = Column(String, index=True)
    blocked_email = Column(String, index=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())