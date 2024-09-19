import jwt
from fastapi import HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")

class Error_message(BaseModel):
	error: bool
	message: str

class Token(BaseModel):
     token: str

class Merchant:
    @staticmethod 
    def jwt_encode(user_name, gmail):
        payload = {
            "user_name": user_name,
            "gmail": gmail,
        }
        encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
        return Token(token = encoded_jwt)

    @staticmethod 
    def jwt_decode(token):
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail=Error_message(error=True, message="Token has expired.").model_dump())
        except jwt.DecodeError:
            raise HTTPException(status_code=403, detail=Error_message(error=True, message="Token decode failed.").model_dump())
        except Exception as e:
            raise HTTPException(status_code=500, detail=Error_message(error=True, message="500 internal server error.").model_dump())

    #{'merchant_name': 'hello', 'user_name': 'midori', 'gmail': 'kawamotoiscute@gmail.com', 'merchant_db_id': 13}
#print(Merchant.jwt_decode('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtZXJjaGFudF9uYW1lIjoiVGVzdDIiLCJ1c2VyX25hbWUiOiJ0ZXN0IiwiZ21haWwiOiJrYXdhbW90b2lzY3V0ZUBnbWFpbC5jb20iLCJtZXJjaGFudF9kYl9pZCI6NTF9.vXy5dYB8ty8koPY62o_pnpGyEJmMCKo9dHExL2bukFI'))
#print(Merchant.jwt_decode("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtZXJjaGFudF9uYW1lIjoiSUtFQVx1NWM1NVx1NzkzYVx1OTU5MyIsInVzZXJfbmFtZSI6IkpVS1RZIiwiZ21haWwiOiJrYXdhbW90b2lzY3V0ZUBnbWFpbC5jb20iLCJtZXJjaGFudF9kYl9pZCI6MzR9.R-pN1mptWqp6VzxcOCJStDg5iZ4NHuw5iIFK8rj23S0"))
class User:
    @staticmethod 
    def jwt_encode(name_user, phone_number_user, gmail, user_id):
        payload = {
            "name_user": name_user,
            "phone_number_user": phone_number_user,
            "gmail": gmail,
            "user_id": user_id
        }
        encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
        return Token(token = encoded_jwt)
    @staticmethod 
    def jwt_decode(token):
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail=Error_message(error=True, message="Token has expired.").model_dump())
        except jwt.DecodeError:
            raise HTTPException(status_code=403, detail=Error_message(error=True, message="Token decode failed.").model_dump())
        except Exception as e:
            raise HTTPException(status_code=500, detail=Error_message(error=True, message="500 internal server error.").model_dump())

