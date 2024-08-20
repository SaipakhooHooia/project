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
        GROUP_CONCAT(DISTINCT CONCAT(sh.service_time_start, ',', sh.service_time_end, ',', sh.price, ',', sh.service_hour_name) SEPARATOR '|') AS service_hours
        FROM 
            merchants.merchant m
        LEFT JOIN 
            merchants.service_hours sh
        ON 
            m.id = sh.merchant_ref_id
        '''
        
    if keyword:
        sql += '''
            WHERE m.merchant_name LIKE %s 
            OR m.intro LIKE %s
            OR m.service_type LIKE %s
        '''
    
    sql += '''
        GROUP BY 
            m.id, m.merchant_name, m.user_name, m.phone_number, m.service_type, m.intro, m.gmail
    '''
    
    if keyword:
        val = (f'%{keyword}%', f'%{keyword}%', f'%{keyword}%')
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
            'service_hours' : result[6]
        }
    close_connection(mycursor, connection)
    if redis_client is not None:
        redis_client.setex(cache_key, 3600, json.dumps(data))
    return data

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
    sql = f"DELETE FROM {db}.{table} WHERE id < {num};"
    mycursor.execute(sql)
    connection.commit()
    close_connection(mycursor, connection)
    if redis_client is not None:
        redis_client.delete(f"table_data:{db}:{table}")

def show_databases():
    connection = create_connection()
    mycursor = connection.cursor()
    sql = "SHOW databases;"
    mycursor.execute(sql)
    rows = mycursor.fetchall()
    close_connection(mycursor, connection)
    for row in rows:
        print(row[0])

def add_merchant(db, table, merchant_name, user_name, gmail, phone_number, merchant_id, service_type, intro):
    connection = create_connection()
    mycursor = connection.cursor()
    if connection is None:
        logging.error("Failed to get a connection from the pool.")
        return False
    try:
        if not check_merchant_exist(connection, db, table, merchant_name):
            sql = """
            INSERT IGNORE INTO {}.{} 
            (merchant_name, user_name, gmail, phone_number, merchant_id, service_type, intro) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """.format(db, table)
            val = (merchant_name, user_name, gmail, phone_number, merchant_id, service_type, intro)
            mycursor.execute(sql, val)
            connection.commit()  # Commit the transaction
            logging.info("Add {} into {} success.".format(merchant_name, table))
            close_connection(mycursor, connection)
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
    if redis_client is not None:
        redis_client.setex(cache_key, 3600, json.dumps(result))  # 快取1小時
    return result

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
            redis_client.delete(f"table_data:{db}:{table}")
            redis_client.delete("merchant_data:all")
        else:
            logging.error("Failed to connect to the database.")
    except Error as e:
        logging.error(f"Error in append_service_hour: {e}")
        if connection and connection.is_connected():
            connection.rollback()

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
    SELECT m.*, sh.*
    FROM merchants.merchant m
    LEFT JOIN merchants.service_hours sh ON m.id = sh.merchant_ref_id
    WHERE m.gmail = %s;
    """
    mycursor.execute(sql, (gmail,))
    rows = mycursor.fetchall()
    #print('rows:', rows)
    result = {}
    for row in rows:
        merchant_name = row[1]
        if merchant_name not in result:
            result[merchant_name] = {
                "contact": row[2],
                "phone_number": row[3],
                "merchant_id": row[4],
                "intro": row[6],
                "service_hours": [],
            }
        
        if row[9] is not None:
            result[merchant_name]["service_hours"].append({
                "startTime": row[9],
                "endTime": row[10],
                "price": row[11],
                "serviceHourName": row[12]
            })
    if redis_client is not None:
        redis_client.setex(cache_key, 3600, json.dumps(result)) 
    close_connection(mycursor, connection)
    return result

#print(get_merchants_by_gmail('kawamotoiscute@gmail.com'))
def modify_data_by_lists(lst, gmail):
    connection = create_connection()
    mycursor = connection.cursor()

    for row in lst:
        merchant_name = row[0][0]
        old_value = row[1]
        new_value = row[2]
        
        if len(row[0]) > 2:
            # 更新 service_hours 表
            if row[0][3] == 'startTime':
                cat = 'service_time_start'
            elif row[0][3] == 'endTime':
                cat = 'service_time_end'
            elif row[0][3] == 'price':
                cat = 'price'
            elif row[0][3] == 'serviceHourName':
                cat = 'service_hour_name'

            # 生成 SQL 查询
            sql = """
                UPDATE merchants.service_hours
                JOIN merchants.merchant ON service_hours.merchant_ref_id = merchant.id
                SET service_hours.%s = %%s
                WHERE merchant.merchant_name = %%s
                AND service_hours.%s = %%s;
            """ % (cat, cat)
            val = (new_value, merchant_name, old_value)
        
        else:
            # 更新 merchant 表
            if row[0][1] == 'contact':
                cat = 'user_name'
            else:
                cat = row[0][1]

            # 生成 SQL 查询
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
            redis_client.delete(f"merchant_data:{merchant_name}")
        except Exception as e:
            print(f"Error executing query: {e}")
            return False
        if redis_client is not None:
            redis_client.delete(f"merchants:all")
            redis_client.delete(f"merchants:{gmail}")
    close_connection(mycursor, connection)
    return True
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
        year, month_name, day = date_str.split('/')
        month = month_mapping.get(month_name, "01")  # 默认返回01（1月）如果找不到匹配
        return f"{year}-{month}-{day.zfill(2)}"
    except ValueError:
        print(f"Invalid date format: {date_str}")
        return None
    
def place_order(order_list, order_id, prime, total_price, name_user_id, booking_phone_number, booking_name, booking_merchant, booking_gmail, is_paid, comment):
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
                time_start, time_end, service_time_name, price, total_price, name_user_id, is_paid, comment) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                
                val = (prime, booking_name, booking_phone_number, booking_gmail, order_id, booking_merchant, date, time_start, time_end, 
                       service_time_name, price, total_price, name_user_id, is_paid, comment)
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


#new_mails = mycursor.fetchall()
#print(new_mails)
#check_order()