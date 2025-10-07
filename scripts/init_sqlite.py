#!/usr/bin/env python3
"""
SQLite Database Initialization Script

This script initializes a SQLite database for local development.
It creates the database file and sets up the basic schema structure.

Usage:
    python scripts/init_sqlite.py

Requirements:
    - SQLAlchemy
    - Your SQLAlchemy models/base configuration

Environment Variables:
    - DATABASE_URL: SQLite connection string (default: sqlite:///local_dev.db)
"""

import os
import sys
from sqlalchemy import MetaData, text
from sqlalchemy.orm import sessionmaker
from db_pool import create_pooled_engine, log_pool_status, start_periodic_pool_logger, quick_healthcheck
from sqlalchemy.ext.declarative import declarative_base

# Import your SQLAlchemy models here
# from your_models import Base, YourModel1, YourModel2

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///local_dev.db')

def init_database():
    """Initialize the SQLite database with schema."""
    try:
        print(f"Initializing SQLite database at: {DATABASE_URL}")

        # Create pooled engine
        engine = create_pooled_engine(DATABASE_URL)
        start_periodic_pool_logger(engine, interval_seconds=15, label="init_sqlite")

        # Create all tables defined in your models
        # Replace this with your actual Base.metadata.create_all() call
        # Base.metadata.create_all(engine)

        print("✅ Database initialized successfully!")
        print(f"📁 Database file location: {DATABASE_URL.replace('sqlite:///', '')}")

        # Optional: Create a test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT sqlite_version()"))
            version = result.fetchone()[0]
            print(f"📊 SQLite version: {version}")

        # Healthcheck and pool status
        ok = quick_healthcheck(engine)
        print(f"🩺 Healthcheck: {'ok' if ok else 'failed'}")
        log_pool_status(engine, label="init_sqlite")

    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        sys.exit(1)

def create_sample_data():
    """Optional: Create sample data for development."""
    try:
        engine = create_pooled_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()

        # Add your sample data creation logic here
        # Example:
        # sample_user = User(name="John Doe", email="john@example.com")
        # db.add(sample_user)
        # db.commit()

        print("✅ Sample data created successfully!")

        db.close()

    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--with-sample-data":
        init_database()
        create_sample_data()
    else:
        init_database()
        print("\n💡 Tip: Run with --with-sample-data to also create sample data")
        print("   python scripts/init_sqlite.py --with-sample-data")