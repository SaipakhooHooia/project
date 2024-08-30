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
    def jwt_encode(merchant_name, user_name, gmail, merchant_db_id):
        payload = {
            "merchant_name": merchant_name,
            "user_name": user_name,
            "gmail": gmail,
            "merchant_db_id": merchant_db_id
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

