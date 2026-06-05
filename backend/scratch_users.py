import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    uri = os.getenv("MONGODB_URI")
    client = AsyncIOMotorClient(uri)
    db = client.get_database()
    users = await db.users.find().to_list(10)
    for u in users:
        print(f"Username: {u.get('username')}, Email: {u.get('email')}, Role: {u.get('role')}")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
