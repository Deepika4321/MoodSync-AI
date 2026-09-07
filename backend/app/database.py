from pymongo import MongoClient
from app.config import MONGO_URI, DATABASE_NAME
import certifi

client = None
db = None

if MONGO_URI:
    client = MongoClient(
        MONGO_URI,
        tls=True,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
        socketTimeoutMS=5000,
        maxPoolSize=50,
        minPoolSize=1,
        retryWrites=True
    )

    db = client[DATABASE_NAME]