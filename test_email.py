import json
import smtplib
from email.message import EmailMessage
import os
from mysql.connector.pooling import MySQLConnectionPool
from mysql.connector.errors import OperationalError
from mysql.connector import Error
import logging

MYSQL_HOST = os.environ['MYSQL_HOST']
MYSQL_USER = os.environ['MYSQL_USER']
MYSQL_PASSWORD = os.environ['MYSQL_PASSWORD']

mydb = {
    "host": MYSQL_HOST,
    "user": MYSQL_USER,
    "password": MYSQL_PASSWORD,
    "database": "merchants"
}

pool = MySQLConnectionPool(pool_name="mypool", pool_size=10, **mydb, connection_timeout=10)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def lambda_handler(event, context):
    msg = EmailMessage()
    msg["From"] = "yoyooo08302000@gmail.com"
    msg["To"] = "kawamotoiscute@gmail.com"
    msg["Subject"] = "test.py"
    msg.set_content("Hi, this is Midori speaking.")

    connection = pool.get_connection()
    if connection.is_connected():
        mycursor = connection.cursor()
        mycursor.execute("SET net_read_timeout=120;")
        mycursor.execute("SET net_write_timeout=120;")
        mycursor.close()
    mycursor = connection.cursor()
    sql = "SHOW COLUMNS FROM {}.{};".format("merchants", "users")
    mycursor.execute(sql)
    row = mycursor.fetchall()
    result = [{"column_name": r[0], "type": r[1]} for r in row]
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
    msg.add_alternative(
        f"<h3>{result}</h3>",
        subtype="html"
    )

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login("yoyooo08302000@gmail.com", os.environ['password'])
            server.send_message(msg)
        return {
            'statusCode': 200,
            'body': 'Email sent successfully!'
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': f'Failed to send email: {str(e)}'
        }
