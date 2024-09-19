from fastapi import FastAPI, Request, File, Form, Body, Query, Header, UploadFile
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from typing import Optional, Dict, List
import requests
from fastapi.templating import Jinja2Templates
from test_calender import test_calender
import os
from dotenv import load_dotenv
import s3
import rds
import jwt_token
import uuid_generate
import json
from fastapi.middleware.cors import CORSMiddleware
from deepdiff import DeepDiff
import re
import uuid_generate
import logging

app = FastAPI()

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
partner_key = os.getenv("partner_key")

templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")
logging.basicConfig(level = logging.INFO, format = '%(asctime)s - %(levelname)s - %(message)s')
logging.basicConfig(level = logging.ERROR, format = '%(asctime)s - %(levelname)s - %(message)s')
logging.basicConfig(level = logging.DEBUG, format = '%(asctime)s - %(levelname)s - %(message)s')

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/health", status_code = 200)
def health_check():
    return {"status": "ok"}

@app.get("/merchant/{merchant_name}", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("merchant.html", {"request": request})

@app.get("/new_merchant_setting", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("new_merchant_setting.html", {"request": request})

@app.get("/merchant_browse", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("merchant_browse.html", {"request": request})

@app.get("/merchant_member_page", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("merchant_member_page.html", {"request": request})

@app.get("/booking", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("booking.html", {"request": request})

@app.get("/signup", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("signup.html", {"request": request})

@app.get("/user_member_page", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("user_member_page.html", {"request": request})

@app.post("/tokensignin")
async def token_signin(request: Request):
    data = await request.json()
    id_token = data.get("id_token")

    # Verify the token with Google
    response = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}")
    if response.status_code != 200:
        return JSONResponse(status_code=401, content={"message": "Invalid token"})

    token_info = response.json()
    if token_info["aud"] != CLIENT_ID:
        return JSONResponse(status_code=401, content={"message": "Invalid token"})

    user_id = token_info["sub"]
    email = token_info["email"]
    name = token_info["name"]

    return {"user_id": user_id, "email": email, "name": name}

@app.get("/api/calender")
async def get_calender():
    return test_calender()

@app.post("/api/signup")
async def signup(request: Request):
    data = await request.json()
    gmail = data.get("gmail")
    name = data.get("name")
    phone_number = data.get("phone_number")

    print(data)
    result = rds.add_merchant_user(name, phone_number, gmail)
    return result

@app.post("/api/user_signup")
async def user_signup(request: Request):
    data = await request.json()
    name_user = data.get("name_user")
    phone_number_user = data.get("phone_number_user")
    gmail = data.get("gmail")
    check_user_exist_result = rds.check_user_exist(db = "merchants", table = "users", gmail = gmail)
    if check_user_exist_result:
        return {"error":"User already exists"}
    else:
        rds.add_user(name_user, phone_number_user, gmail)
        user_id = rds.check_user_exist(db = "merchants", table = "users", gmail = gmail)[0][0]
        print("user_id:",user_id)
    #{'name_user': 'midori', 'phone_number_user': '0979521432', 'gmail': 'kawamotoiscute@gmail.com'}
        user_token = jwt_token.User.jwt_encode(name_user, phone_number_user, gmail, user_id)
        print(user_token)
    return user_token

@app.post("/api/login")
async def login(request: Request):
    data = await request.json()
    gmail = data.get("gmail")
    print(gmail)
    check_user_exist_result = rds.check_user_exist(db = "merchants", table = "merchant_user", gmail = gmail)
    if check_user_exist_result == False:
        return {"error":"User does not exist"}
    elif check_user_exist_result:
        result = check_user_exist_result[0]
        user_name = result[1]
        gmail = result[3]
        encode_token = jwt_token.Merchant.jwt_encode(user_name, gmail)
        return  encode_token

@app.post("/api/login_user")
async def login(request: Request):
    data = await request.json()
    gmail = data.get("gmail")
    print(gmail)
    check_user_exist_result = rds.check_user_exist(db = "merchants", table = "users", gmail = gmail)
    if check_user_exist_result == False:
        return {"error":"User does not exist"}
    elif check_user_exist_result:
        user_id = check_user_exist_result[0][0]
        name_user = check_user_exist_result[0][1]
        phone_number_user = check_user_exist_result[0][2]
        gmail = check_user_exist_result[0][3]
        encode_token = jwt_token.User.jwt_encode(name_user, phone_number_user, gmail, user_id)
        return  {"token":encode_token, "user": name_user, "gmail": gmail, "user_id": user_id}
'''  
@app.post("/api/merchant-setting")
async def merchant_setting(request: Request , service_hour : Optional[str] = Form(None), image: List[Optional[UploadFile]] = File(None),token : Optional[str] = Form(...)):
    print("service_hour:", service_hour)
    decode_token = jwt_token.Merchant.jwt_decode(token)
    folder = decode_token["merchant_name"]
    if image:
        for i in image:
            print(i)
            if i.filename != "":
                file_extension = os.path.splitext(i.filename)[1]
                i.filename = str(uuid_generate.create_uuid()) + file_extension
                file_location = os.path.join("tmp", i.filename)
                print(file_location)
                with open(file_location, "wb") as file:
                    file.write(await i.read())
                s3.upload_photo_to_folder("examplebucket10101010", folder, "./tmp/"+i.filename)
                os.remove(file_location)
    if service_hour:
        service_hour_dict = json.loads(service_hour)
        decode_token = jwt_token.Merchant.jwt_decode(token)
        merchant_ref_id = get_id("merchants", "merchant", merchant_name)
        print("decode_token:", decode_token)
        print("merchant_ref_id:", merchant_ref_id)
        print("decode_token[\"merchant_db_id\"]:", decode_token["merchant_db_id"])
        on_broad = service_hour_dict.get('merchant_on_broad', False)
        agreement = service_hour_dict.get('agreement', False)
        print("merchant_on_broad:", on_broad)
        print("agreement:", agreement)
        for key, value in service_hour_dict.items():
            if isinstance(value, dict) and 'start' in value:
                print(key, value)
                print("merchant_ref_id:", merchant_ref_id)
                print("service_time_start:", value["start"])
                print("service_time_end:", value["end"])
                rds.append_service_hour(
                    db="merchants",
                    table="service_hours",
                    service_time_start=value["start"],
                    service_time_end=value["end"],
                    price=value["price"],
                    service_hour_name=value["name"],
                    merchant_ref_id=merchant_ref_id
                )
                rds.update_on_broad(db="merchants", table="merchant", on_broad=on_broad, id=merchant_ref_id)

    return{"ok":True}
'''
@app.get("/api/merchanting")
async def get_merchants():
    try:
        type_list = ["辦公","民宿","藝術","娛樂","運動"]
        total_data = {}
        lists_dict = {}
        for item in type_list:
            lists_dict[item] = []
        #{'辦公': [], '民宿': [], '藝術': [], '娛樂': [], '運動': []}

        folder_and_images = s3.get_folder_and_images("examplebucket10101010")
        merchant_and_service_type = rds.get_data("merchants", "merchant")
        logging.debug("folder_and_images: %s", folder_and_images)
        logging.debug("merchant_and_service_type: %s", merchant_and_service_type)
        for item in merchant_and_service_type:
            for key, value in lists_dict.items():
                if item[5] == key:
                    lists_dict[key].append({item[1]:folder_and_images[item[1]]})
        keywords = rds.get_keyword()
        total_data['merchant_data'] = lists_dict
        total_data['keywords'] = keywords
        print("total_data:",total_data)
        return total_data
    except Exception as e:
        logging.error("Error: %s", str(e), exc_info=True)
        return {"error": str(e)}
@app.get("/api/merchants-browse")
async def get_merchant(keyword : Optional[str] = Query(None)):
    if keyword:
        data_result = rds.get_data_in_json(keyword = keyword)
        image_result = s3.list_images_in_folders("examplebucket10101010", *data_result.keys())
    else:
        data_result = rds.get_data_in_json()
        image_result = s3.list_images_in_folders("examplebucket10101010", *data_result.keys())
    for key, images in zip(data_result.keys(), image_result):
        data_result[key]['images'] = images

    return data_result

@app.get("/api/merchant/{merchant_name}")
async def get_merchant(merchant_name : str):
    data_result = rds.get_data_in_json(keyword = merchant_name)
    image_result = s3.list_images_in_folders("examplebucket10101010", *data_result.keys())
    calender_data = test_calender()
    order_data = rds.get_future_orders(merchant_name)
    for key, images in zip(data_result.keys(), image_result):
        data_result[key]['images'] = images
        data_result[key]['calender'] = calender_data
    data_result['order_history'] = order_data
    #print("data_result type:",type(data_result))
    return data_result

@app.get("/api/merchant_auth")
async def auth(request: Request):
    authorization = request.headers.get("Authorization")
    try:
        decode_token = jwt_token.Merchant.jwt_decode(authorization)
        user_gmail = decode_token['gmail']
        result = rds.get_merchants_by_gmail(user_gmail)
        return result
    except Exception as e:
        print("Error:", str(e))
        return {"error": str(e)}

@app.post("/api/update_merchant_data")
async def update_merchant_data(request: Request):
    data = await request.json()
    print("raw data:",data)
    original_data = data[0]
    modify_data = data[1]
    token = data[2]
    gmail = jwt_token.Merchant.jwt_decode(token)['gmail']
    diff_dict = DeepDiff(original_data, modify_data, verbose_level=2)
    if diff_dict and gmail:
        print("diff_dict:",diff_dict)
        diff = diff_dict['values_changed']
        def parse_key(key):
            matches = re.findall(r"\['(.*?)'\]|(\d+)", key)
            matches = [match[0] if match[0] else match[1] for match in matches]
            categories = [int(match) if match.isdigit() else match for match in matches]
            merchant = re.search(r"root\['(.*?)'\]", key).group(1)
            return merchant, categories

        modify_lists = []
        for key, value in diff.items():
            merchant, categories = parse_key(key)
            modify_list = [categories, value['old_value'], value['new_value']]
            modify_lists.append(modify_list)

        result = rds.modify_data_by_lists(modify_lists, gmail)
        return result 
    else:
        return

def verify_order(order_data):
    reservation_data = json.loads(order_data['reservation'])
    
    merchant_name = reservation_data['merchant_name']
    reservations = reservation_data['reservations']
    results = []
    for date, time_slots in reservations.items():
        for time_slot in time_slots:
            start = time_slot['start']
            end = time_slot['end']
            price = int(time_slot['price'])
            result = rds.check_price(merchant_name = merchant_name, start_time = start, end_time = end, price = price)
            results.append(result)

    print("results:", results)
    if False in results:
        return {"message": "Invalid order data"}
    else:
        return True
     
import json

@app.post("/api/booking")
async def booking(request: Request):
    data = await request.json()
    
    print("Data received:")
    print(data)  

    try:
        reservation_str = data["order"]["reservation"]
        reservation_dict = json.loads(reservation_str)  

        print(f"Type of reservation_dict: {type(reservation_dict)}")
        print(f"Contents of reservation_dict: {reservation_dict}")

        order_list = reservation_dict["reservations"]
        print(f"Parsed order_list: {order_list}")

        check_same_order = rds.check_same_order(order_list)
        if check_same_order.get("error"):
            return check_same_order

        verify_result = verify_order(data['order'])
        if verify_result != True:
            return verify_result

        merchant_id = "tppf_MidoriTapPay_GP_POS_3"
        token = request.headers.get("Authorization")
        order_id = uuid_generate.create_uuid()

        decode_token = jwt_token.User.jwt_decode(token)
        if decode_token:
            payload = {
                "prime": data["prime"],
                "partner_key": partner_key,
                "merchant_id": merchant_id,
                "amount": int(data["order"]["totalPrice"]),
                "order_number": str(order_id),
                "bank_transaction_id": str(order_id),  
                "details": "ATM",
                "cardholder": {
                    "phone_number": data["order"]["phoneNumber"],
                    "name": data["order"]["name"],
                    "email": data["order"]["gmail"]
                },
                "expire_in_days": 1
            }
            headers = {
                "Content-Type": "application/json",
                "x-api-key": partner_key
            }

            response = requests.post("https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime", json=payload, headers=headers)
            response_data = response.json()
            
            if response.status_code == 200:
                if response_data.get("status") == 0:
                    print("Payment success")
                    rds.place_order(
                        order_list=order_list,
                        order_id=order_id,
                        prime=data["prime"],
                        name_user_id=data["order"]["userID"],
                        total_price=int(data["order"]["totalPrice"]),
                        booking_phone_number=data["order"]["phoneNumber"],
                        booking_merchant=reservation_dict['merchant_name'],
                        booking_name=data["order"]["name"],
                        booking_gmail=data["order"]["gmail"],
                        is_paid=1,
                        comment=None,
                        rec_trade_id = response_data.get("rec_trade_id"),
                        bank_transaction_id = response_data.get("bank_transaction_id")
                    )
                    return {"message": "Payment success", "data": str(order_id)}
                else:
                    print(f"Payment failed: {response_data.get('msg')}")
                    rds.place_order(
                        order_list=order_list,
                        order_id=order_id,
                        prime=data["prime"],
                        name_user_id=data["order"]["userID"],
                        total_price=int(data["order"]["totalPrice"]),
                        booking_phone_number=data["order"]["phoneNumber"],
                        booking_merchant=reservation_dict['merchant_name'],
                        booking_name=data["order"]["name"],
                        booking_gmail=data["order"]["gmail"],
                        is_paid=0,
                        comment=response_data.get('msg'),
                        rec_trade_id = response_data.get("rec_trade_id"),
                        bank_transaction_id = response_data.get("bank_transaction_id")
                    )
                    return {"error": "Payment failed", "message": response_data.get("msg")}
            else:
                print(f"HTTP 錯誤: {response.status_code}")
                rds.place_order(
                    order_list=order_list,
                    order_id=order_id,
                    prime=data["prime"],
                    name_user_id=data["order"]["userID"],
                    total_price=int(data["order"]["totalPrice"]),
                    booking_phone_number=data["order"]["phoneNumber"],
                    booking_merchant=reservation_dict['merchant_name'],
                    booking_name=data["order"]["name"],
                    booking_gmail=data["order"]["gmail"],
                    is_paid=0,
                    comment=f"HTTP 錯誤: {response.status_code}",
                    rec_trade_id = response_data.get("rec_trade_id"),
                    bank_transaction_id = response_data.get("bank_transaction_id")
                )
                return {"error": "HTTP error", "status_code": response.status_code}
        else:
            return {"error": "invalid token: wrong user name or gmail"}
    except Exception as e:
        print("Error:", str(e))
        return {"error": "處理請求時發生錯誤", "message": str(e)}

@app.get("/api/get_orders")
async def get_orders(request: Request, category : Optional[str] = Query(None), keyword : Optional[str] = Query(None)):
    authorization = request.headers.get("Authorization")
    if category is not None or keyword is not None:
        print(category, keyword)
    decode_token = jwt_token.Merchant.jwt_decode(authorization)
    if decode_token:
        #merchant_name = decode_token["merchant_name"]
        gmail = decode_token["gmail"]
    if category == "blur":
        print(category, keyword)
        result = rds.get_orders(gmail = gmail, category = None,keyword = keyword)
    elif category is not None and keyword is not None:
        result = rds.get_orders(gmail, category, keyword)
    else:
        result = rds.get_orders(gmail)
    #print("result:", result)
    return result

@app.put("/api/edit_order/{clickedOrderId}")
async def edit_order(request: Request, clickedOrderId : str):
    authorization = request.headers.get("Authorization")
    request_body = await request.json()
    original_data = request_body[0]
    new_data = request_body[1]
    merchant_name = original_data["merchant_name"]
    decode_token = jwt_token.Merchant.jwt_decode(authorization)
    if decode_token:
        gmail = decode_token["gmail"]
        diff_dict = DeepDiff(original_data, new_data, verbose_level=2)
        if diff_dict and gmail:
            diff = diff_dict['values_changed']
            edit_diff = {}
            for key in diff.keys():
                categories = key.replace("root['", "").replace("']", "")
                edit_diff[categories] = diff[key]
    result = rds.edit_order(edit_diff, clickedOrderId, merchant_name)
    return result

@app.delete("/api/delete_order/{clickedOrderId}")   
async def delete_order(request: Request, clickedOrderId : str):
    authorization = request.headers.get("Authorization")
    decode_token = jwt_token.Merchant.jwt_decode(authorization)
    if decode_token:
        result = rds.delete_order(clickedOrderId)
    return result

@app.put("/api/refund_order/{clickedOrderId}")
async def refund_order(request: Request, clickedOrderId : str):
    authorization = request.headers.get("Authorization")
    try: 
        decode_token = jwt_token.Merchant.jwt_decode(authorization)
    except:
        decode_token = jwt_token.User.jwt_decode(authorization)
    print("decode_token:", decode_token)
    if decode_token:
        result = rds.get_rec_trade_id_and_amount(clickedOrderId)
        prime = result['prime']
        rec_trade_id = result['rec_trade_id']
        total_price = result['total_price']
        print("prime:", prime)
        print("refund amount:", total_price)
        url = "https://sandbox.tappaysdk.com/tpc/transaction/refund"
        merchant_id = "tppf_MidoriTapPay_GP_POS_3"
    
        headers = {
            "Content-Type": "application/json",
            "x-api-key": partner_key,
        }

        payload = {
            "partner_key": partner_key,
            "merchant_id": merchant_id,
            "rec_trade_id": rec_trade_id,
            "amount": total_price
        }

        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            response_data = response.json()
            print('response_data:', response_data)
            if response_data.get('msg') == 'Success':
                result = rds.refund_order(clickedOrderId, total_price)
                return result
            else:
                result = {"Tappay refund error": response_data.get('msg')}
                return result
        else:
            print(f"HTTP 錯誤: {response.status_code}")
            return {"error": "HTTP error", "status_code": response.status_code}
        
@app.get("/api/user_auth")
async def user_auth(request: Request, is_paid : Optional[int] = Query(None), date : Optional[str] = Query(None), passed : Optional[int] = Query(None)):
    authorization = request.headers.get("Authorization")
    print("authorization:", authorization)
    try:
        decode_token = jwt_token.User.jwt_decode(authorization)
        user_gmail = decode_token['gmail']
        print("user_gmail:", user_gmail)
        datas = rds.get_order_by_usermail(user_gmail, is_paid, date, passed)
        image_datas = []
        merchants = []
        for data in datas:
            if data['merchant_name'] not in merchants:
                merchants.append(data['merchant_name'])
        for merchant in merchants:
            images = s3.list_images_in_folders("examplebucket10101010", merchant)[0][0]
            image_result = {
                "merchant_name": data['merchant_name'],
                "images": images
            }
            image_datas.append(image_result)
            for data in datas:
                if data['merchant_name'] == merchant:
                    data['images'] = images
        #print("image_datas:", image_datas)
        #print("datas:", datas)
        return {"data": datas}
            
    except Exception as e:
        print("Error:", str(e))
        return {"error": str(e)}

@app.put("/api/feedback/{orderId}")
async def feedback(request: Request, orderId: str):
    authorization = request.headers.get("Authorization")
    request_body = await request.json()
    score = request_body['rate']
    print("score:", score)
    print("orderId:", orderId)
    decode_token = jwt_token.User.jwt_decode(authorization)
    if decode_token:
        try:
            result = rds.add_feedback(score, orderId)
            return result
        except Exception as e:
            print("Error:", str(e))
            return {"error": "評分送出失敗，請稍後再試"}

@app.post("/api/add-merchant")
async def merchant_setting(request: Request , service_hour : Optional[str] = Form(None), merchant_on_broad: Optional[bool] = Form(None), 
                           agreement: Optional[bool] = Form(None), merchant_data: Optional[str] = Form(None), image: List[Optional[UploadFile]] = File(None)):
    authorization = request.headers.get("Authorization")
    decode_token = jwt_token.Merchant.jwt_decode(authorization)
    merchant_gmail = decode_token['gmail']
    print("authorization:", authorization)
    merchant_data = json.loads(merchant_data)
    merchant_name = merchant_data.get("merchant_name")
    user_name = merchant_data.get("user_name")
    gmail = merchant_gmail
    phone_number = merchant_data.get("phone_number")
    account_num = merchant_data.get("account_number")
    service_type = merchant_data.get("service_type")
    intro = merchant_data.get("intro")
    address = merchant_data.get("address")
    google_map_src = merchant_data.get("google_map_src")
    supply = merchant_data.get("supply")
    note = merchant_data.get("note")
    on_broad = merchant_on_broad
    rds.add_merchant("merchants", "merchant", merchant_name, user_name, gmail, phone_number, account_num, service_type, 
                 intro, address, google_map_src, supply, note, on_broad)
    s3.create_folder("examplebucket10101010", merchant_name+"/")
    merchant_ref_id = rds.get_id("merchants", "merchant", merchant_name)
    new_encode_token_object = str(jwt_token.Merchant.jwt_encode(user_name, gmail)).split("=")[1]
    new_encode_token = new_encode_token_object.replace('\'', '')
    print("new_encode_token:", new_encode_token)
    new_decode_token = jwt_token.Merchant.jwt_decode(new_encode_token)
    print("new_decode_token:", new_decode_token)

    #-------------------加上service hours和照片-------------------   
    folder = merchant_name
    print("folder:", folder)
    if image:
        for i in image:
            print(i)
            if i.filename != "":
                file_extension = os.path.splitext(i.filename)[1]
                i.filename = str(uuid_generate.create_uuid()) + file_extension
                file_location = os.path.join("tmp", i.filename)
                print(file_location)
                with open(file_location, "wb") as file:
                    file.write(await i.read())
                s3.upload_photo_to_folder("examplebucket10101010", folder, "./tmp/"+i.filename)
                os.remove(file_location)
    if service_hour:
        service_hour_dict = json.loads(service_hour)
        merchant_ref_id = rds.get_id("merchants", "merchant", merchant_name)
        print("decode_token:", new_decode_token)
        print("merchant_ref_id:", merchant_ref_id)
        #print("decode_token[\"merchant_db_id\"]:", new_decode_token["merchant_db_id"])
        print("merchant_on_broad:", on_broad)
        print("agreement:", agreement)
        for key, value in service_hour_dict.items():
            if isinstance(value, dict) and 'start' in value:
                print(key, value)
                print("merchant_ref_id:", merchant_ref_id)
                print("service_time_start:", value["start"])
                print("service_time_end:", value["end"])
                rds.append_service_hour(
                    db="merchants",
                    table="service_hours",
                    service_time_start=value["start"],
                    service_time_end=value["end"],
                    price=value["price"],
                    service_hour_name=value["name"],
                    merchant_ref_id=merchant_ref_id
                )
    return {"success": "商家新增成功"}

@app.post("/api/signup-merchant")
async def signup_merchant(request: Request , service_hour : Optional[str] = Form(None), merchant_on_broad: Optional[bool] = Form(None), 
                           agreement: Optional[bool] = Form(None), merchant_data: Optional[str] = Form(None), image: List[Optional[UploadFile]] = File(None),
                           gmail: Optional[str] = Form(None)):
    print("gmail:", gmail)
    service_hour = json.loads(service_hour)
    merchant_data = json.loads(merchant_data)
    print("image:", image)
    print("service_hour:", service_hour)
    print("merchant_on_broad:", merchant_on_broad)
    print("agreement:", agreement)
    print("merchant_data:", merchant_data)
    return {"success": "商家註冊成功"}

if __name__ == "__main__":
    import uvicorn
    logging.info("server start")
    uvicorn.run(app, host="0.0.0.0", port=8000)
