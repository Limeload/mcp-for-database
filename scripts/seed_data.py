#!/usr/bin/env python3
"""
SQLite Sample Data Seeding Script

This script populates the SQLite database with realistic sample data
for development and testing purposes.

Usage:
    python scripts/seed_data.py

Requirements:
    - SQLAlchemy
    - Your SQLAlchemy models
    - Initialized database (run init_sqlite.py first)

Environment Variables:
    - DATABASE_URL: SQLite connection string (default: sqlite:///local_dev.db)
"""

import os
import sys
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import sessionmaker
from db_pool import create_pooled_engine, log_pool_status

# Import your SQLAlchemy models here
# from your_models import User, Product, Order, Base

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///local_dev.db')

def create_sample_users(db):
    """Create sample user data."""
    print("Creating sample users...")

    # Sample user data
    users_data = [
        {"name": "Alice Johnson", "email": "alice@example.com", "role": "admin"},
        {"name": "Bob Smith", "email": "bob@example.com", "role": "user"},
        {"name": "Carol Williams", "email": "carol@example.com", "role": "user"},
        {"name": "David Brown", "email": "david@example.com", "role": "moderator"},
        {"name": "Emma Davis", "email": "emma@example.com", "role": "user"},
        {"name": "Frank Miller", "email": "frank@example.com", "role": "user"},
        {"name": "Grace Wilson", "email": "grace@example.com", "role": "user"},
        {"name": "Henry Taylor", "email": "henry@example.com", "role": "user"},
        {"name": "Ivy Anderson", "email": "ivy@example.com", "role": "user"},
        {"name": "Jack Thomas", "email": "jack@example.com", "role": "user"},
    ]

    # Uncomment and modify based on your User model
    # for user_data in users_data:
    #     user = User(**user_data)
    #     user.created_at = datetime.utcnow() - timedelta(days=random.randint(0, 365))
    #     db.add(user)

    # db.commit()
    print("✅ Sample users created")

def create_sample_products(db):
    """Create sample product data."""
    print("Creating sample products...")

    # Sample product data
    products_data = [
        {"name": "Laptop Pro", "price": 1299.99, "category": "Electronics"},
        {"name": "Wireless Mouse", "price": 29.99, "category": "Electronics"},
        {"name": "Coffee Maker", "price": 89.99, "category": "Appliances"},
        {"name": "Running Shoes", "price": 149.99, "category": "Sports"},
        {"name": "Book: Python Guide", "price": 39.99, "category": "Books"},
        {"name": "Desk Chair", "price": 299.99, "category": "Furniture"},
        {"name": "Headphones", "price": 199.99, "category": "Electronics"},
        {"name": "Water Bottle", "price": 24.99, "category": "Sports"},
        {"name": "Notebook", "price": 9.99, "category": "Stationery"},
        {"name": "Smartphone Case", "price": 19.99, "category": "Electronics"},
    ]

    # Uncomment and modify based on your Product model
    # for product_data in products_data:
    #     product = Product(**product_data)
    #     db.add(product)

    # db.commit()
    print("✅ Sample products created")

def create_sample_orders(db):
    """Create sample order data."""
    print("Creating sample orders...")

    # Sample order data - requires users and products to exist first
    # Uncomment and modify based on your Order model
    # for i in range(50):
    #     order = Order(
    #         user_id=random.randint(1, 10),
    #         product_id=random.randint(1, 10),
    #         quantity=random.randint(1, 5),
    #         order_date=datetime.utcnow() - timedelta(days=random.randint(0, 90))
    #     )
    #     db.add(order)

    # db.commit()
    print("✅ Sample orders created")

def seed_database():
    """Main function to seed the database with sample data."""
    try:
        print(f"Seeding database: {DATABASE_URL}")

        # Create pooled engine and session
        engine = create_pooled_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()

        # Create sample data
        create_sample_users(db)
        create_sample_products(db)
        create_sample_orders(db)

        db.close()
        log_pool_status(engine, label="seed_data")
        print("✅ Database seeding completed successfully!")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        sys.exit(1)

def clear_existing_data(db):
    """Optional: Clear existing data before seeding."""
    try:
        print("Clearing existing data...")

        # Uncomment and modify based on your models
        # db.query(Order).delete()
        # db.query(Product).delete()
        # db.query(User).delete()
        # db.commit()

        print("✅ Existing data cleared")

    except Exception as e:
        print(f"⚠️  Warning: Could not clear existing data: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--clear":
        engine = create_pooled_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        clear_existing_data(db)
        db.close()
        print("💡 Run without --clear to seed data")
    else:
        seed_database()
        print("\n💡 Tip: Run with --clear to clear existing data first")
        print("   python scripts/seed_data.py --clear")