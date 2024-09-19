from mysql.connector.pooling import MySQLConnectionPool
from mysql.connector.errors import OperationalError
from mysql.connector import Error
import logging
import os
from dotenv import load_dotenv
import redis
import json
from datetime import datetime
import time
import mail_sending_func

load_dotenv()

MYSQL_HOST = os.getenv('MYSQL_HOST')
MYSQL_USER = os.getenv('MYSQL_USER')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')

mydb = {
    "host" : MYSQL_HOST,
    "user" : MYSQL_USER,
    "password" : MYSQL_PASSWORD,
}

pool = MySQLConnectionPool(pool_name = "mypool", pool_size = 10, **mydb,  connection_timeout = 10)

redis_client = None
try:
    redis_host = os.getenv('REDIS_HOST', 'localhost')
    redis_port = int(os.getenv('REDIS_PORT', 6379))
    redis_client = redis.Redis(host=redis_host, port=redis_port)
    redis_client.ping()
    print(f"Connected to Redis: {redis_host}:{redis_port}")
except Exception as e:
    print(f"Redis connection failed: {e}. Fallback to alternative approach.")
    redis_client = None

'''
for _ in range(5):
    try:
        r = redis.Redis(host=redis_host, port=redis_port)
        r.ping()
        print("Connected to Redis")
        break
    except redis.ConnectionError:
        print("Failed to connect to Redis, retrying...")
        time.sleep(5)'''

logging.basicConfig(level = logging.INFO, format = '%(asctime)s - %(levelname)s - %(message)s')
logging.basicConfig(level = logging.ERROR, format = '%(asctime)s - %(levelname)s - %(message)s')
logging.basicConfig(level=logging.DEBUG, format = '%(asctime)s - %(levelname)s - %(message)s')

def create_connection():
    connection = pool.get_connection()
    if connection.is_connected():
        mycursor = connection.cursor()
        mycursor.execute("SET net_read_timeout=120;")
        mycursor.execute("SET net_write_timeout=120;")
        mycursor.close()
        logging.info("Connection to RDS from create_connection success.")
    return connection

def check_connection():
    connection = create_connection()
    if connection.is_connected():
        logging.info("Connected to RDS success.")
        return True
    else:
        logging.error("Connected to RDS failed.")
        return False

def close_connection(mycursor, connection):
    try:
        if mycursor and not mycursor.is_closed():
            mycursor.close()
            logging.info("Cursor closed.")
    except Exception as e:
        logging.error(f"Error closing cursor: {e}")

    try:
        if connection and connection.is_connected():
            connection.close()
            logging.info("Database connection closed.")
    except Exception as e:
        logging.error(f"Error closing connection: {e}")

def cache_get(key, fetch_function, expire_time=3600):
    cached_data = redis_client.get(key)
    if cached_data:
        return json.loads(cached_data)
    
    data = fetch_function()
    redis_client.setex(key, expire_time, json.dumps(data))
    return data

def show_tables(db, table):
    cache_key = f"table_structure:{db}:{table}"
    cached_data = redis_client.get(cache_key)
    if cached_data:
        logging.info(f"Get table structure from cache: {cached_data}")
        return json.loads(cached_data)
    logging.info(f"Get table structure from DB directly: {db}.{table}")
    connection = create_connection()
    mycursor = connection.cursor()
    sql = "SHOW COLUMNS FROM {}.{};".format(db,table)
    mycursor.execute(sql)
    row = mycursor.fetchall()
    close_connection(mycursor, connection)
    
    result = [{"column_name": r[0], "type": r[1]} for r in row]
    redis_client.setex(cache_key, 3600, json.dumps(result))  # 快取1小時
    return result

#print(show_tables("merchants", "merchant"))
def add_data(comment = None, image = None):
    connection = create_connection()
    mycursor = connection.cursor()
    sql = "INSERT INTO chat_broad.chat_record (comment, image) VALUES (%s, %s)"
    val = (comment, image)
    mycursor.execute(sql, val)
    connection.commit()
    close_connection(mycursor, connection)
    redis_client.delete("table_data:chat_broad:chat_record")

def show_data(db, table):
    connection = create_connection()
    mycursor = connection.cursor()
    sql = "SELECT * FROM {}.{};".format(db,table)
    mycursor.execute(sql)
    row = mycursor.fetchall()

    for result in row:
        print(result)
    close_connection(mycursor, connection)

def fetch_data_from_db(db, table):
    connection = create_connection()
    mycursor = connection.cursor()
    try:
        sql = "SELECT * FROM {}.{};".format(db,table)
        mycursor.execute(sql)
        row = mycursor.fetchall()
        close_connection(mycursor, connection)
        return row
    except Exception as e:
        logging.error(f"Error fetching data from database: {e}")
        close_connection(mycursor, connection)
        return {"error": f"Error fetching data from database: {e}"}
def get_data(db, table):
    if redis_client is not None:
        cache_key = f"table_data:{db}:{table}"
        logging.info(f"Redis available. Fetching data from cache for {db}.{table}")
        return cache_get(cache_key, lambda: fetch_data_from_db(db, table))
    else: 
        logging.info(f"Redis not available. Fetching data from DB directly for {db}.{table}")
        return fetch_data_from_db(db, table)

def get_keyword():
    connection = create_connection()
    mycursor = connection.cursor()
    sql = "SELECT keyword FROM merchants.keyword ORDER BY search_count DESC LIMIT 14;"
    mycursor.execute(sql)
    row = mycursor.fetchall()
    keywords = [r[0] for r in row]
    close_connection(mycursor, connection)
    return keywords

def get_data_in_json(keyword = None):
    if redis_client is not None:
        cache_key = f"merchant_data:{keyword}" if keyword else "merchant_data:all"
        cached_data = redis_client.get(cache_key)
        if cached_data:
            logging.info(f"Get data from cache: {cached_data}")
            return json.loads(cached_data)
    logging.info(f"Fetch data from DB for {keyword}")
    connection = create_connection()
    mycursor = connection.cursor()
    data = {}
    sql = '''
        SELECT 
        m.id AS merchant_id,
        m.merchant_name,
        m.user_name,
        m.phone_number,
        m.service_type,
        m.intro,
        m.address,
        m.google_map_src,
        m.supply,
        m.note,
        m.on_broad,
        GROUP_CONCAT(DISTINCT CONCAT(sh.service_time_start, ',', sh.service_time_end, ',', sh.price, ',', sh.service_hour_name) SEPARATOR '|') AS service_hours
        FROM 
            merchants.merchant m
        LEFT JOIN 
            merchants.service_hours sh
        ON 
            m.id = sh.merchant_ref_id
        WHERE
            m.on_broad = 1
        '''
        
    if keyword:
        sql += '''
            AND (
            m.merchant_name LIKE %s 
            OR m.intro LIKE %s
            OR m.service_type LIKE %s
            OR m.address LIKE %s
            )
        '''
    
    sql += '''
        GROUP BY 
            m.id, m.merchant_name, m.user_name, m.phone_number, m.service_type, m.intro, m.gmail
    '''
    
    if keyword:
        val = (f'%{keyword}%', f'%{keyword}%', f'%{keyword}%', f'%{keyword}%')
    else:
        val = ()

    mycursor.execute(sql,val)
    row = mycursor.fetchall()
    for result in row:
        data[result[1]] = {
            'merchant_id' : result[0],
            'user_name' : result[2],
            'phone_number' : result[3],
            'service_type' : result[4],
            'intro' : result[5],
            'address' : result[6],
            'google_map_src' : result[7],
            'supply' : result[8],
            'note' : result[9],
            'on_broad' : result[10],
            'service_hours' : result[11]
        }

    if keyword is not None and keyword not in ['辦公', '娛樂', '運動', '民宿', '藝術'] and len(row) > 0:
        sql = f'SELECT keyword FROM merchants.keyword WHERE keyword = %s'
        val = (keyword,)
        mycursor.execute(sql,val)
        row = mycursor.fetchall()
        if len(row) == 0:
            sql = f'INSERT INTO merchants.keyword (keyword, search_count) VALUES (%s, %s)'
            val = (keyword, 1)
            mycursor.execute(sql,val)
            connection.commit()
        else:
            sql = f'UPDATE merchants.keyword SET search_count = search_count + 1 WHERE keyword = %s'
            val = (keyword,)
            mycursor.execute(sql,val)
            connection.commit()

    close_connection(mycursor, connection)
    if redis_client is not None:
        redis_client.setex(cache_key, 3600, json.dumps(data))
    return data

#print(get_data_in_json(keyword = '娛樂'))
#print(get_data_in_json('林園撞球館'))
def manage_data():
    connection = create_connection()
    mycursor = connection.cursor()
    actions = {
        'show_tables': show_tables,
        'add_data': add_data,
        'show_data': show_data,
        'get_data': get_data
    }

    action = input("Input the action you want to do (show_tables, add_data, show_data, get_data): ").strip()

    if action in actions:
        if action == 'add_data':
            comment = input("Input comment: ")
            image = input("Input image: ")
            actions[action](comment, image)
            close_connection(mycursor, connection)
        else:
            actions[action]()
    else:
        pass

def delete_data(db, table, num):
    connection = create_connection()
    mycursor = connection.cursor()
    try:
        sql = f"DELETE FROM {db}.{table} WHERE id = {num};"
        mycursor.execute(sql)
        connection.commit()
        close_connection(mycursor, connection)
        if redis_client is not None:
            redis_client.delete(f"table_data:{db}:{table}")
        return {"message": "Data deleted successfully."}
    except Error as e:
        logging.error(f"Error deleting data from database: {e}")
        close_connection(mycursor, connection)

def show_databases():
    connection = create_connection()
    mycursor = connection.cursor()
    sql = "SHOW databases;"
    mycursor.execute(sql)
    rows = mycursor.fetchall()
    close_connection(mycursor, connection)
    for row in rows:
        print(row[0])

def add_merchant(db, table, merchant_name, user_name, gmail, phone_number, account_num, service_type, 
                 intro, address, google_map_src, supply, note, on_broad):
    connection = create_connection()
    mycursor = connection.cursor()
    if connection is None:
        logging.error("Failed to get a connection from the pool.")
        return False
    try:
        if not check_merchant_exist(connection, db, table, merchant_name):
            sql = """
            INSERT IGNORE INTO {}.{} 
            (merchant_name, user_name, gmail, phone_number, account_num, service_type, intro, address, google_map_src, supply, note, on_broad) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """.format(db, table)
            val = (merchant_name, user_name, gmail, phone_number, account_num, service_type, intro, address, google_map_src, supply, note, on_broad)
            mycursor.execute(sql, val)
            connection.commit()  # Commit the transaction
            logging.info("Add {} into {} success.".format(merchant_name, table))
            close_connection(mycursor, connection)
            if redis_client is not None:
                redis_client.delete(f"table_data:{db}:{table}")
                redis_client.delete("merchant_data:all")
                redis_client.delete(f"merchants:{gmail}")
                delete_merchant_data_cache(service_type)
                delete_merchant_data_cache(intro)
            return True
        else:
            logging.info("Merchant {} already exists.".format(merchant_name))
            return False
    except OperationalError as e:
        logging.error("OperationalError: %s", e)
        return False

def get_id(db, table, merchant_name):
    if redis_client is not None:
        cache_key = f"merchant_id:{db}:{table}:{merchant_name}"
        cached_id = redis_client.get(cache_key)
        if cached_id:
            logging.info(f"Get merchant id from cache: {cached_id}")
            return int(cached_id)
    logging.info(f"Get merchant id from DB directly: {merchant_name}")
    connection = create_connection()
    mycursor = connection.cursor()
    sql = "SELECT id FROM {}.{} WHERE merchant_name = %s;".format(db, table)
    mycursor.execute(sql, (merchant_name,))
    row = mycursor.fetchone()
    close_connection(mycursor, connection)
    
    if row:
        merchant_id = row[0]
        if redis_client is not None:
            redis_client.setex(cache_key, 3600, str(merchant_id))  # 快取1小時
        return merchant_id
    return None
    
def check_merchant_exist(connection, db, table, merchant_name):
    connection = create_connection()
    mycursor = connection.cursor()
    sql = "SELECT * FROM {}.{} WHERE merchant_name = %s;".format(db, table)
    mycursor.execute(sql, (merchant_name,))
    row = mycursor.fetchall()
    close_connection(mycursor, connection)
    return len(row) > 0

def add_merchant_user(name, phone_num, gmail):
    try:
        connection = create_connection()
        mycursor = connection.cursor()
        sql = "SELECT * FROM merchants.merchant_user WHERE gmail = %s;"
        mycursor.execute(sql, (gmail,))
        row = mycursor.fetchall()
        if len(row) == 0:
            sql = "INSERT INTO merchants.merchant_user (name, phone_number, gmail) VALUES (%s, %s, %s);"
            val = (name, phone_num, gmail)
            mycursor.execute(sql, val)
            connection.commit()
            return {"message": "帳號新增成功，前往登入"}
        elif len(row) > 0:
            return {"error": "商家帳號已存在"}
    except OperationalError as e:
        logging.error("OperationalError: %s", e)
        return {"error": "新增帳號失敗，請稍後再試"}
    finally:
        close_connection(mycursor, connection)

def check_user_exist(db, table, gmail):
    if redis_client is not None:
        cache_key = f"user_exist:{db}:{table}:{gmail}"
        cached_data = redis_client.get(cache_key)
        if cached_data is not None:
            logging.info(f"Get user data from cache: {cached_data}")
            return json.loads(cached_data)
    
    connection = create_connection()
    mycursor = connection.cursor()
    sql = "SELECT * FROM {}.{} WHERE gmail = %s;".format(db, table)
    mycursor.execute(sql, (gmail,))
    row = mycursor.fetchall()
    close_connection(mycursor, connection)
    
    result = False if len(row) == 0 else row
    #if redis_client is not None:
    #    redis_client.setex(cache_key, 3600, json.dumps(result))  # 快取1小時
    return result

#print(check_user_exist(db = "merchants", table = "merchant_user", gmail = 'kawamotoiscute@gmail.com'))
#print(check_user_exist("merchants", "users", "kawamotoiscute@gmail.com"))
def append_service_hour(db, table, service_time_start, service_time_end, price, service_hour_name, merchant_ref_id):
    connection = create_connection()
    mycursor = connection.cursor()
    try:
        connection = pool.get_connection()
        if connection.is_connected():
            mycursor = connection.cursor()
            sql = f"INSERT INTO {db}.{table} (service_time_start, service_time_end, price, service_hour_name, merchant_ref_id) VALUES (%s, %s, %s, %s, %s)"
            val = (service_time_start, service_time_end, price, service_hour_name, merchant_ref_id)
            mycursor.execute(sql, val)
            connection.commit()
            logging.info(f"Added {service_hour_name} into {table} successfully.")
            close_connection(mycursor, connection)
            if redis_client is not None:
                redis_client.delete(f"table_data:{db}:{table}")
                redis_client.delete("merchant_data:all")
        else:
            logging.error("Failed to connect to the database.")
    except Error as e:
        logging.error(f"Error in append_service_hour: {e}")
        if connection and connection.is_connected():
            connection.rollback()

def update_on_broad(db, table, on_broad, id):
    connection = create_connection()
    mycursor = connection.cursor()
    sql = f"UPDATE {db}.{table} SET on_broad = %s WHERE id = %s"
    val = (on_broad, id)
    mycursor.execute(sql, val)
    connection.commit()
    close_connection(mycursor, connection)
    if redis_client is not None:
        redis_client.delete(f"table_data:{db}:{table}")
        redis_client.delete("merchant_data:all")

def get_merchants_by_gmail(gmail):
    if redis_client is not None:
        cache_key = f"merchants:{gmail}"
        cached_data = redis_client.get(cache_key)
        if cached_data:
            logging.info(f"Cache hit for {gmail}")
            return json.loads(cached_data)
    logging.info(f"Get merchants from DB directly: {gmail}")
    connection = create_connection()
    mycursor = connection.cursor()
    sql = """
    SELECT m.merchant_name, m.user_name,m.phone_number, m.account_num, m.intro, m.address, m.google_map_src, m.supply, m.note, 
    m.on_broad, m.door_password, sh.service_time_start, sh.service_time_end, sh.price, sh.service_hour_name
    FROM merchants.merchant m
    LEFT JOIN merchants.service_hours sh ON m.id = sh.merchant_ref_id
    WHERE m.gmail = %s;
    """
    mycursor.execute(sql, (gmail,))
    rows = mycursor.fetchall()
    #print('rows:', rows)
    result = {}
    for row in rows:
        merchant_name = row[0]
        if merchant_name not in result:
            result[merchant_name] = {
                "contact": row[1],
                "phone_number": row[2],
                "account_num": row[3],
                "intro": row[4],
                "address": row[5],
                "google_map_src": row[6],
                "supply": row[7],
                "note": row[8],
                "on_broad": row[9],
                "door_password": row[10],
                "service_hours": [],
            }
        
        if row[9] is not None:
            result[merchant_name]["service_hours"].append({
                "startTime": row[11],
                "endTime": row[12],
                "price": row[13],
                "serviceHourName": row[14]
            })
    if redis_client is not None:
        redis_client.setex(cache_key, 3600, json.dumps(result)) 
    close_connection(mycursor, connection)
    return result

#print(get_merchants_by_gmail('kawamotoiscute@gmail.com'))
#print(get_merchants_by_gmail('kawamotoiscute@gmail.com'))
def modify_data_by_lists(lst, gmail):
    connection = create_connection()
    mycursor = connection.cursor()
    try:
        for row in lst:
            merchant_name = row[0][0]
            old_value = row[1]
            new_value = row[2]
            
            if len(row[0]) > 2:
                if row[0][3] == 'startTime':
                    cat = 'service_time_start'
                elif row[0][3] == 'endTime':
                    cat = 'service_time_end'
                elif row[0][3] == 'price':
                    cat = 'price'
                elif row[0][3] == 'serviceHourName':
                    cat = 'service_hour_name'

                sql = """
                    UPDATE merchants.service_hours
                    JOIN merchants.merchant ON service_hours.merchant_ref_id = merchant.id
                    SET service_hours.%s = %%s
                    WHERE merchant.merchant_name = %%s
                    AND service_hours.%s = %%s;
                """ % (cat, cat)
                val = (new_value, merchant_name, old_value)
            
            else:
                if row[0][1] == 'contact':
                    cat = 'user_name'
                else:
                    cat = row[0][1]

                sql = """
                    UPDATE merchants.merchant
                    SET %s = %%s
                    WHERE merchant_name = %%s
                    AND %s = %%s;
                """ % (cat, cat)
                val = (new_value, merchant_name, old_value)
            
            print('SQL:', sql)
            print('Values:', val)
            
            try:
                mycursor.execute(sql, val)
                connection.commit()
                
                if redis_client:
                    redis_client.delete(f"merchant_data:{merchant_name}")
            except Exception as e:
                print(f"Error executing query: {e}")
                close_connection(mycursor, connection)
                return {"error": "Error updating data."}
            
            if redis_client:
                try:
                    redis_client.delete(f"merchants:all")
                    redis_client.delete(f"merchants:{gmail}")
                except Exception as e:
                    print(f"Error deleting from Redis: {e}")
                    close_connection(mycursor, connection)
        
        close_connection(mycursor, connection)
        return {"message": "Data updated successfully."}
    except Exception as e:
        print(f"Error executing query: {e}")
        close_connection(mycursor, connection)
        return {"error": "Error updating data."}

    #modify_lists: [[['IKEA展示間', 'intro'], '某間家具專賣店風格的民宿', '某間家具專賣店風格的民宿，非ikea直營店'], [['本能寺會客室', 'contact'], '織田信長', '織田先生'], [['林園撞球館', 'service_hours', 1, 'startTime'], '15:00', '16:00'], [['林園撞球館', 'service_hours', 1, 'endTime'], '19:00', '20:00']]

def add_user(name_user, phone_number_user, gmail):
    connection = create_connection()
    mycursor = connection.cursor()
    sql = "INSERT IGNORE INTO merchants.users (name_user, phone_number_user, gmail) VALUES (%s, %s, %s)"
    val = (name_user, phone_number_user, gmail)
    try:
        mycursor.execute(sql, val)
        connection.commit()
    except Exception as e:
        print(f"Error executing query: {e}")
        return False
    close_connection(mycursor, connection)
    if redis_client is not None:
        redis_client.delete(f"users:{gmail}")
        redis_client.delete(f"user_exist:merchants:users:{gmail}")
    return True

def check_cache(keyword=None):
    if redis_client is not None:
        cache_key = f"merchant_data:{keyword}" if keyword else "merchant_data:all"
        cached_data = redis_client.get(cache_key)
        if cached_data:
            print(f"Cache key: {cache_key}")
            print("Cached data:")
            print(json.loads(cached_data))
    else:
        print(f"No data found for cache key: {cache_key}")

def delete_merchant_data_cache(keyword=None):
    cache_key = f"merchant_data:{keyword}" if keyword else "merchant_data:all"
    try:
        result = redis_client.delete(cache_key)
        if result:
            print(f"Successfully deleted cache for key: {cache_key}")
        else:
            print(f"No cache found for key: {cache_key}")
        return result
    except Exception as e:
        print(f"Error deleting cache for key {cache_key}: {str(e)}")
        return False

def check_price(merchant_name, start_time, end_time, price):
    connection = create_connection()
    mycursor = connection.cursor()
    try:
        sql = "SELECT id FROM merchants.merchant WHERE merchant_name = %s;"
        val = (merchant_name,)
        mycursor.execute(sql, val)
        rows = mycursor.fetchall()
        if len(rows) == 0:
            return False
        else:
            merchant_id = rows[0][0]
            sql = "SELECT * FROM merchants.service_hours WHERE merchant_ref_id = %s AND service_time_start = %s AND service_time_end = %s AND price = %s;"
            val = (merchant_id, start_time, end_time, price)
            mycursor.execute(sql, val)
            rows = mycursor.fetchall()
            close_connection(mycursor, connection)
            if len(rows) > 0:
                return True
            else:
                return False
    except Exception as e:
        print(f"Error executing query: {e}") 

month_mapping = {
    "January": "01",
    "February": "02",
    "March": "03",
    "April": "04",
    "May": "05",
    "June": "06",
    "July": "07",
    "August": "08",
    "September": "09",
    "October": "10",
    "November": "11",
    "December": "12"
}

def convert_date(date_str):
    try:
        if '/' in date_str:
            year, month_name, day = date_str.split('/')
            month = month_mapping.get(month_name, "01")  # 默认返回01（1月）如果找不到匹配
            return f"{year}-{month}-{day.zfill(2)}"
        elif '-' in date_str:
            return date_str
    except ValueError:
        print(f"Invalid date format: {date_str}")
        return None

def check_same_order(order_list):
    connection = create_connection()
    mycursor = connection.cursor()

    for date, reservations in order_list.items():
        date = convert_date(date)
        print(date)
        for reservation in reservations:
            time_start = reservation.get("start")
            time_end = reservation.get("end")
            if time_start is not None and time_end is not None:
                print(time_start, time_end)
                sql = "SELECT * FROM merchants.orders WHERE date = %s AND time_start = %s AND time_end = %s AND is_paid = 1;"
                val = (date, time_start, time_end)
                mycursor.execute(sql, val)
                rows = mycursor.fetchall()
                if len(rows) > 0:
                    print("此時段已被預約")
                    return {"error": "此時段已被預約"}
                if mycursor.rowcount == 0:
                    return {"success": "此時段可預約"}
            close_connection(mycursor, connection)
                
def place_order(order_list, order_id, prime, total_price, name_user_id, booking_phone_number, booking_name, booking_merchant, 
                booking_gmail, is_paid, comment, rec_trade_id, bank_transaction_id):
    connection = create_connection()
    mycursor = connection.cursor()
    try:
        for date, reservations in order_list.items():
            date = convert_date(date)
            for reservation in reservations:
                time_start = reservation.get("start")
                time_end = reservation.get("end")
                service_time_name = reservation.get("service_name")
                price = reservation.get("price")
                sql = """ 
                    INSERT INTO merchants.orders (prime, booking_name_user, booking_phone_number_user, booking_gmail, order_number, booking_merchant, date,
                    time_start, time_end, service_time_name, price, total_price, name_user_id, is_paid, comment, rec_trade_id, bank_transaction_id) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                    
                val = (prime, booking_name, booking_phone_number, booking_gmail, order_id, booking_merchant, date, time_start, time_end, 
                        service_time_name, price, total_price, name_user_id, is_paid, comment, rec_trade_id, bank_transaction_id)
                mycursor.execute(sql, val)
            connection.commit()

        if is_paid == True:
            sql = """
            INSERT INTO merchants.mails (prime, booking_name_user, booking_phone_number_user, booking_gmail, order_number, 
            booking_merchant, name_user_id) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            val = (prime, booking_name, booking_phone_number, booking_gmail, order_id, booking_merchant, name_user_id)
            mycursor.execute(sql, val)
            connection.commit()
        close_connection(mycursor, connection)
        return True
    except Exception as e:
        print(f"Error executing query: {e}")
        close_connection(mycursor, connection)
        return False

#print(check_user_exist("merchants", "merchant", "kawamotoiscute@gmail.com"))
#delete_data("merchants", "merchant", 50)
#show_data("merchants", "merchant")
#show_data("merchants", "users")
#print(show_tables("merchants", "service_hours"))
#print(check_price(merchant_name = '山海之間', start_time = '15:00', end_time = '11:00', price = '2300'))
#print(show_data("merchants", "service_hours"))

def check_order():
    connection = create_connection()
    mycursor = connection.cursor()
    sql = '''
    SELECT id, prime, booking_name_user, booking_phone_number_user, booking_gmail, order_number, booking_merchant,
        date, time_start, time_end, service_time_name, price, total_price, name_user_id, is_paid, comment,
        CONVERT_TZ(order_time, 'UTC', 'Asia/Taipei') AS order_time_tw
    FROM merchants.orders;'''

    mycursor.execute(sql)
    rows = mycursor.fetchall()
    for row in rows:
        print(row)

    close_connection(mycursor, connection)

def get_orders(gmail, category=None, keyword=None):
    connection = create_connection()
    mycursor = connection.cursor()
    print(gmail, category, keyword)
    sql = """
    SELECT m.merchant_name, m.service_type, o.id, o.prime, o.booking_name_user, o.booking_phone_number_user, o.booking_gmail, o.order_number, o.date,
    o.time_start, o.time_end, o.service_time_name, o.price, o.total_price, o.is_paid, o.comment, o.order_time
    FROM merchants.merchant m
    LEFT JOIN merchants.orders o ON m.merchant_name = o.booking_merchant
    WHERE m.gmail = %s
    """
    params = [gmail]
    
    if category is not None and keyword is not None:
        if category == 'o.id':
            sql += f" AND {category} = %s"
            params.append(int(keyword))
        elif category == 'o.is_paid':
            sql += f" AND {category} = %s"
            params.append(int(keyword))
        else:
            sql += f" AND {category} LIKE %s"
            params.append(f"%{keyword}%")
    elif category is None and keyword is not None:
        sql += """
        AND (
            m.merchant_name LIKE %s OR
            o.prime LIKE %s OR
            o.booking_name_user LIKE %s OR
            o.booking_phone_number_user LIKE %s OR
            o.booking_gmail LIKE %s OR
            o.order_number LIKE %s OR
            o.date LIKE %s OR
            o.time_start LIKE %s OR
            o.time_end LIKE %s OR
            o.service_time_name LIKE %s OR
            o.price LIKE %s OR
            o.total_price LIKE %s OR
            o.is_paid LIKE %s OR
            o.comment LIKE %s OR
            o.order_time LIKE %s
        )
        """
        params.extend([f"%{keyword}%"] * 15)
    sql += ";"

    mycursor.execute(sql, params)
    rows = mycursor.fetchall()

    payload = []
    for row in rows:
        result = {
            "merchant_name": row[0],
            "order_id": row[2],
            "prime": row[3],
            "booking_name_user": row[4],
            "booking_phone_number_user": row[5],
            "booking_gmail": row[6],
            "order_number": row[7],
            "date": row[8],
            "time_start": row[9],
            "time_end": row[10],
            "service_time_name": row[11],
            "price": row[12],
            "total_price": row[13],
            "is_paid": row[14],
            "comment": row[15]
        }
        payload.append(result)

    close_connection(mycursor, connection)
    return payload

print(get_orders('kawamotoiscute@gmail.com', category='o.is_paid', keyword=1))
def check_time_overlap(mycursor, date,  merchant_name, order_id, time_changed):
    sql = """
        SELECT * FROM merchants.orders 
        WHERE date = %s 
        AND booking_merchant = %s place_order
        AND (
            (time_start < %s AND time_end > %s)
            OR (time_start < %s AND time_end > %s)
            OR (%s BETWEEN time_start AND time_end)
            OR (%s BETWEEN time_start AND time_end)
        )
        AND id != %s
        AND is_paid = 1;
    """
    val = (date, merchant_name, time_changed, time_changed, time_changed, time_changed, time_changed, time_changed, order_id)
    mycursor.execute(sql, val)
    return mycursor.fetchall()

def send_email_data(clickedOrderId, mycursor, connection):
    sql = "SELECT booking_name_user, booking_gmail,  booking_merchant, date, time_start, time_end FROM merchants.orders WHERE id = %s;"
    val = (clickedOrderId,)
    mycursor.execute(sql, val)
    new_order = mycursor.fetchone()
    booking_name = new_order[0]
    booking_gmail = new_order[1]
    booking_merchant = new_order[2]
    date = new_order[3]
    time_start = new_order[4]
    time_end = new_order[5]
    result = mail_sending_func.send_edit_order_mail(booking_name, booking_gmail, booking_merchant, date, 
                                           time_start, time_end)
    return result['statusCode']

def edit_order(edit_diff, clickedOrderId, merchant_name):
    connection = create_connection()
    mycursor = connection.cursor()
    print("edit_diff", edit_diff, clickedOrderId, merchant_name)
    try:
        if 'date' in edit_diff:
            new_date = edit_diff['date']['new_value']
            if 'time_start' in edit_diff:
                time_conflict = check_time_overlap(mycursor, new_date, merchant_name, clickedOrderId, edit_diff['time_start']['new_value'])
                if len(time_conflict) > 0:
                    return {'error': '該時段已被預約,請重新選擇時間'}
                else:
                    sql = "UPDATE merchants.orders SET date = %s, time_start = %s WHERE id = %s;"
                    val = (new_date, edit_diff['time_start']['new_value'], clickedOrderId)
                    mycursor.execute(sql, val)
                    connection.commit()
                    statusCode = send_email_data(clickedOrderId, mycursor, connection)
                    if statusCode == 200:
                        sql = "INSERT INTO merchants.edit_order_inform_mail (order_id, notification_sent) VALUES (%s, %s);"
                        val = (clickedOrderId, 1)
                        mycursor.execute(sql, val)
                        connection.commit()
                        return {'message': '修改成功，客戶通知信寄件成功'}
                    else:
                        sql = "INSERT INTO merchants.edit_order_inform_mail (order_id, notification_sent) VALUES (%s, %s);"
                        val = (clickedOrderId, 0)
                        mycursor.execute(sql, val)
                        connection.commit()
                        return {'message': '修改成功，客戶通知信寄件失敗'}
            if 'time_end' in edit_diff:
                time_conflict = check_time_overlap(mycursor, new_date, merchant_name, clickedOrderId, edit_diff['time_end']['new_value'])
                if len(time_conflict) > 0:
                    return {'error': '該時段已被預約,請重新選擇時間'}
                else:
                    sql = "UPDATE merchants.orders SET date = %s, time_end = %s WHERE id = %s;"
                    val = (new_date, edit_diff['time_end']['new_value'], clickedOrderId)
                    mycursor.execute(sql, val)
                    connection.commit()
                    statusCode = send_email_data(clickedOrderId, mycursor, connection)
                    if statusCode == 200:
                        sql = "INSERT INTO merchants.edit_order_inform_mail (order_id, notification_sent) VALUES (%s, %s);"
                        val = (clickedOrderId, 1)
                        mycursor.execute(sql, val)
                        connection.commit()
                        return {'message': '修改成功，客戶通知信寄件成功'}
                    else:
                        sql = "INSERT INTO merchants.edit_order_inform_mail (order_id, notification_sent) VALUES (%s, %s);"
                        val = (clickedOrderId, 0)
                        mycursor.execute(sql, val)
                        connection.commit()
                        return {'message': '修改成功，客戶通知信寄件失敗'}
            if 'time_start' not in edit_diff and 'time_end' not in edit_diff:
                sql = "SELECT time_start, time_end FROM merchants.orders WHERE id = %s;"
                val = (clickedOrderId,)
                mycursor.execute(sql, val)
                old_time = mycursor.fetchone()
                old_time_start = old_time[0]
                old_time_end = old_time[1]
                time_conflict = check_time_overlap(mycursor, new_date, merchant_name, clickedOrderId, old_time_start)
                time_conflict2 = check_time_overlap(mycursor, new_date, merchant_name, clickedOrderId, old_time_end)
                if len(time_conflict) > 0 or len(time_conflict2) > 0:
                    return {'error': '該時段已被預約,請重新選擇時間'}
                else:
                    sql = "UPDATE merchants.orders SET date = %s WHERE id = %s;"
                    val = (new_date, clickedOrderId)
                    mycursor.execute(sql, val)
                    connection.commit()
                    statusCode = send_email_data(clickedOrderId, mycursor, connection)
                    if statusCode == 200:
                        sql = "INSERT INTO merchants.edit_order_inform_mail (order_id, notification_sent) VALUES (%s, %s);"
                        val = (clickedOrderId, 1)
                        mycursor.execute(sql, val)
                        connection.commit()
                        return {'message': '修改成功，客戶通知信寄件成功'}
                    else:
                        sql = "INSERT INTO merchants.edit_order_inform_mail (order_id, notification_sent) VALUES (%s, %s);"
                        val = (clickedOrderId, 0)
                        mycursor.execute(sql, val)
                        connection.commit()
                        return {'error': '修改成功，客戶通知信寄件失敗'}
        if 'date' not in edit_diff and ('time_start' in edit_diff or 'time_end' in edit_diff):
                sql = "SELECT date FROM merchants.orders WHERE id = %s;"
                val = (clickedOrderId,)
                mycursor.execute(sql, val)
                old_date = mycursor.fetchone()[0]
                if 'time_start' in edit_diff:
                    time_conflict = check_time_overlap(mycursor, old_date, merchant_name, clickedOrderId, edit_diff['time_start']['new_value'])
                    if len(time_conflict) > 0:
                        return {'error': '該時段已被預約,請重新選擇時間'}
                    else:
                        sql = "UPDATE merchants.orders SET time_start = %s WHERE id = %s;"
                        val = (edit_diff['time_start']['new_value'], clickedOrderId)
                        mycursor.execute(sql, val)
                        connection.commit()
                        statusCode = send_email_data(clickedOrderId, mycursor, connection)
                        if statusCode == 200:
                            sql = "INSERT INTO merchants.edit_order_inform_mail (order_id, notification_sent) VALUES (%s, %s);"
                            val = (clickedOrderId, 1)
                            mycursor.execute(sql, val)
                            connection.commit()
                            return {'message': '修改成功，客戶通知信寄件成功'}
                        else:
                            sql = "INSERT INTO merchants.edit_order_inform_mail (order_id, notification_sent) VALUES (%s, %s);"
                            val = (clickedOrderId, 0)
                            mycursor.execute(sql, val)
                            connection.commit()
                            return {'error': '修改成功，客戶通知信寄件失敗'}
                if 'time_end' in edit_diff:
                    time_conflict = check_time_overlap(mycursor, old_date, merchant_name, clickedOrderId, edit_diff['time_end']['new_value'])
                    if len(time_conflict) > 0:
                        return {'error': '該時段已被預約,請重新選擇時間'}
                    else:
                        sql = "UPDATE merchants.orders SET time_end = %s WHERE id = %s;"
                        val = (edit_diff['time_end']['new_value'], clickedOrderId)
                        mycursor.execute(sql, val)
                        connection.commit()
                        statusCode = send_email_data(clickedOrderId, mycursor, connection)
                        if statusCode == 200:
                            sql = "INSERT INTO merchants.edit_order_inform_mail (order_id, notification_sent) VALUES (%s, %s);"
                            val = (clickedOrderId, 1)
                            mycursor.execute(sql, val)
                            connection.commit()
                            return {'message': '修改成功，客戶通知信寄件成功'}
                        else:
                            sql = "INSERT INTO merchants.edit_order_inform_mail (order_id, notification_sent) VALUES (%s, %s);"
                            val = (clickedOrderId, 0)
                            mycursor.execute(sql, val)
                            connection.commit()
                            return {'error': '修改成功，客戶通知信寄件失敗'}
                        
        if 'booking_name_user' in edit_diff:
            sql = "UPDATE merchants.orders SET booking_name_user = %s WHERE id = %s;"
            val = (edit_diff['booking_name_user']['new_value'], clickedOrderId)
            mycursor.execute(sql, val)
            connection.commit()
        if 'booking_phone_number_user' in edit_diff:
            sql = "UPDATE merchants.orders SET booking_phone_number_user = %s WHERE id = %s;"
            val = (edit_diff['booking_phone_number_user']['new_value'], clickedOrderId)
            mycursor.execute(sql, val)
            connection.commit()
        if 'booking_gmail' in edit_diff:
            sql = "UPDATE merchants.orders SET booking_gmail = %s WHERE id = %s;"
            val = (edit_diff['booking_gmail']['new_value'], clickedOrderId)
            mycursor.execute(sql, val)
            connection.commit()

        return {'message': '修改成功'}
    except OperationalError as e:
        logging.error("OperationalError: %s", e)
        return {'error': f'OperationalError: {e}'}
    except Exception as e:
        logging.error("Error: %s", e)
        return {'error': f'Error: {e}'}
    finally:
        close_connection(mycursor, connection)

def delete_order(order_id):
    connection = create_connection()
    mycursor = connection.cursor()
    try:
        sql = f"DELETE FROM merchants.password_mail WHERE order_id = {order_id};"
        mycursor.execute(sql)
        connection.commit()
        sql = "SELECT booking_name_user, booking_gmail,  booking_merchant, date, time_start, time_end FROM merchants.orders WHERE id = %s;"
        mycursor.execute(sql, (order_id,))
        row = mycursor.fetchone()
        booking_name_user = row[0]
        booking_gmail = row[1]
        booking_merchant = row[2]
        date = row[3]
        time_start = row[4]
        time_end = row[5]
        sql = f"DELETE FROM merchants.orders WHERE id = {order_id};"
        mycursor.execute(sql)
        connection.commit()
        if redis_client is not None:
            redis_client.delete(f"table_data:merchants:orders")
        statusCode = mail_sending_func.send_delete_order_mail(booking_name_user, booking_gmail, booking_merchant, date, time_start, time_end)
        if statusCode == 200:
            sql = "INSERT INTO merchants.delete_order_inform_mail (order_id, notification_sent) VALUES (%s, %s);"
            val = (order_id, 1)
            mycursor.execute(sql, val)
            connection.commit()
            return {"message": "訂單刪除成功，客戶通知信寄件成功"}
        else:
            sql = "INSERT INTO merchants.delete_order_inform_mail (order_id, notification_sent) VALUES (%s, %s);"
            val = (order_id, 0)
            mycursor.execute(sql, val)
            connection.commit()
            return {"message": "訂單刪除成功，客戶通知信寄件失敗"}
        #return {"message": "Data deleted successfully."}
    except Error as e:
        logging.error(f"Error deleting data from database: {e}")
        return {"error": f"Error deleting data from database: {e}"}
    finally:
        close_connection(mycursor, connection)

    
def get_rec_trade_id_and_amount(order_id):
    connection = create_connection()
    mycursor = connection.cursor()
    try:
        sql = "SELECT prime, rec_trade_id, total_price FROM merchants.orders WHERE id = %s;"
        mycursor.execute(sql, (order_id,))
        row = mycursor.fetchone()
        prime = row[0]
        rec_trade_id = row[1]
        total_price = row[2]
        sql = "UPDATE merchants.orders SET is_paid = %s WHERE prime = %s;"
        val = ("已退款", prime)
        mycursor.execute(sql, val)
        connection.commit()
        return {"prime": prime, "rec_trade_id": rec_trade_id, "total_price": total_price}
    except Exception as e:
        print(f"Error executing query: {e}")
        close_connection(mycursor, connection)
        return None

def refund_order(clickedOrderId, price):
    connection = create_connection()
    mycursor = connection.cursor()
    try:
        sql = "INSERT INTO merchants.refund (order_id, price) VALUES (%s, %s);"
        val = (clickedOrderId, price)
        mycursor.execute(sql, val)
        connection.commit()
        sql = "SELECT prime, rec_trade_id, total_price FROM merchants.orders WHERE id = %s;"
        mycursor.execute(sql, (clickedOrderId,))
        row = mycursor.fetchone()
        prime = row[0]
        sql = "UPDATE merchants.orders SET is_paid = %s WHERE prime = %s;"
        val = (2, prime)
        mycursor.execute(sql, val)
        connection.commit()
        sql = "SELECT booking_name_user, booking_gmail,  booking_merchant, date, time_start, time_end, total_price FROM merchants.orders WHERE prime = %s;"
        mycursor.execute(sql, (prime,))
        rows = mycursor.fetchall()
        mail_datas = []
        for row in rows:
            mail_data = {
                'booking_name_user': row[0],
                'booking_gmail': row[1],
                'booking_merchant': row[2],
                'date': row[3],
                'time_start': row[4],
                'time_end': row[5],
                'total_price': row[6]
            }
            mail_datas.append(mail_data) 
        statusCode = mail_sending_func.send_refund_order_mail(mail_datas)
        if statusCode == 200:
            sql = "INSERT INTO merchants.refund_order_inform_mail (order_id, notification_sent) VALUES (%s, %s);"
            val = (clickedOrderId, 1)
            mycursor.execute(sql, val)
            connection.commit()
            return {"message": "退款成功"}
        else:
            sql = "INSERT INTO merchants.refund_order_inform_mail (order_id, notification_sent) VALUES (%s, %s);"
            val = (clickedOrderId, 0)
            mycursor.execute(sql, val)
            connection.commit()
            return {"message": "退款成功"}
        #return {"message": "退款成功"}
    except Exception as e:
        logging.error(f"Error executing query: {e}")
        return {"error": f"Error executing query: {e}"}
    
    finally:
        close_connection(mycursor, connection)
    
def get_future_orders(merchant_name):
    connection = create_connection()
    mycursor = connection.cursor()
    try:
        sql = "SELECT date, time_start, time_end FROM merchants.orders WHERE booking_merchant = %s AND date >= DATE(NOW()) AND is_paid = 1;"
        #sql = "SELECT * FROM merchants.orders WHERE booking_merchant = %s AND is_paid = 1 AND id > 80;"
        mycursor.execute(sql, (merchant_name,))
        rows = mycursor.fetchall()
        results = {}
        for row in rows:
            results[str(row[0])] = {"time_start": row[1], "time_end": row[2]}
        close_connection(mycursor, connection)
        print(results)
        return rows
    except Exception as e:
        print(f"Error executing query: {e}")
        close_connection(mycursor, connection)
        logging.error(f"Error executing query: {e}")

def get_order_by_usermail(usermail, is_paid = None, date = None, passed = None):
    connection = create_connection()
    mycursor = connection.cursor()
    try:
        if is_paid is not None:
            if is_paid == 1 and passed == 1:
                sql = """
                SELECT booking_merchant, order_number, date, time_start, time_end, service_time_name, price, is_paid, order_time, id, rate
                FROM merchants.orders 
                WHERE booking_gmail = %s AND date < %s AND is_paid = 1 
                ORDER BY date DESC, time_start DESC;"""
                val = (usermail, date)
            elif is_paid == 1 and passed == 0:
                sql = """
                SELECT booking_merchant, order_number, date, time_start, time_end, service_time_name, price, is_paid, order_time, id, rate
                FROM merchants.orders 
                WHERE booking_gmail = %s AND date >= %s AND is_paid = 1
                ORDER BY date , time_start ;"""
                val = (usermail, date)
            elif is_paid == 2:
                sql = """
                SELECT booking_merchant, order_number, date, time_start, time_end, service_time_name, price, is_paid, order_time, id, rate
                FROM merchants.orders 
                WHERE booking_gmail = %s AND is_paid = 2
                ORDER BY date , time_start ;"""
                val = (usermail, )
        else:#查詢全部的訂單
            sql = """
            SELECT booking_merchant, order_number, date, time_start, time_end, service_time_name, price, is_paid, order_time, id, rate
            FROM merchants.orders 
            WHERE booking_gmail = %s
            ORDER BY order_time DESC, time_start DESC;"""
            val = (usermail,)
        mycursor.execute(sql, val)
        rows = mycursor.fetchall()
        close_connection(mycursor, connection)
        result = []
        for row in rows:
            data = {
                'merchant_name': row[0],
                'order_number': row[1],
                'date': row[2],
                'time_start': row[3],
                'time_end': row[4],
                'service_time_name': row[5],
                'price': row[6],
                'is_paid': row[7],
                'order_time': row[8],
                'id': row[9],
                'rate': row[10]
            }
            result.append(data)
        return result
    except Exception as e:
        print(f"Error executing query: {e}")
        return {"error": f"Error executing query: {e}"}

def add_feedback(score, orderId):
    connection = create_connection()
    mycursor = connection.cursor()
    try:
        sql = "UPDATE merchants.orders SET rate = %s WHERE id = %s;"
        val = (score, orderId)
        mycursor.execute(sql, val)
        connection.commit()
        return {"message": "評分成功"}
    except Exception as e:
        print(f"Error executing query: {e}")
        logging.error(f"Error executing query: {e}")
        return {"error": f"Error executing query: {e}"}
    finally:
        close_connection(mycursor, connection)
#print(get_order_by_usermail('kawamotoiscute@gmail.com', date = '2024-09-10'))
#print(get_future_orders('山海之間'))
#get_future_orders('林園撞球館')
#print(get_orders('kawamotoiscute@gmail.com', 'm.merchant_name', "林園"))
#get_orders('kawamotoiscute@gmail.com')
#new_mails = mycursor.fetchall()
#print(new_mails)
#check_order()