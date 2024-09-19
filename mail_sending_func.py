import json
import smtplib
from email.message import EmailMessage
import os
from mysql.connector.pooling import MySQLConnectionPool
from mysql.connector.errors import OperationalError
from mysql.connector import Error
import logging
from dotenv import load_dotenv

load_dotenv()

def send_edit_order_mail(booking_name, booking_gmail, booking_merchant, date, time_start, time_end):
    msg = EmailMessage()
    msg["From"] = "yoyooo08302000@gmail.com"
    msg["To"] = booking_gmail
    msg["Subject"] = "Unnamed Rental預約變更通知"
    mail_content = f"""
    {booking_name.strip()} 您好，您的預約已經變更，以下是您的預約資訊：

    預約商家：{booking_merchant}
    預約日期：{date}
    預約開始時間：{time_start}
    預約結束時間：{time_end}
    """
    msg.set_content(mail_content)

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login("yoyooo08302000@gmail.com", os.getenv("EMAIL_PASSWORD"))
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
    
def send_delete_order_mail(booking_name_user, booking_gmail, booking_merchant, date, time_start, time_end):
    msg = EmailMessage()
    msg["From"] = "yoyooo08302000@gmail.com"
    msg["To"] = booking_gmail
    msg["Subject"] = "Unnamed Rental預約取消通知"
    mail_content = f"""
    {booking_name_user.strip()} 您好，您的預約已取消，以下是原預約資訊：

    預約商家：{booking_merchant}
    預約日期：{date}
    預約開始時間：{time_start}
    預約結束時間：{time_end}
    """
    msg.set_content(mail_content)

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login("yoyooo08302000@gmail.com", os.getenv("EMAIL_PASSWORD"))
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
    
def send_refund_order_mail(mail_datas):

    booking_name_user = mail_datas[0]['booking_name_user']
    booking_gmail = mail_datas[0]['booking_gmail']
    total_price = mail_datas[0]['total_price']

    msg = EmailMessage()
    msg["From"] = "yoyooo08302000@gmail.com"
    msg["To"] = booking_gmail
    msg["Subject"] = "Unnamed Rental退款通知"
    mail_content = f"""
    {booking_name_user.strip()} 您好，您的預約已退款，以下是原預約資訊："""

    for data in mail_datas:
        mail_content += f"""
            預約商家：{data['booking_merchant']}
            預約日期：{data['date']}
            預約開始時間：{data['time_start']}
            預約結束時間：{data['time_end']}
            """
    mail_content += f"總退款金額：{total_price}"
    msg.set_content(mail_content)

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login("yoyooo08302000@gmail.com", os.getenv("EMAIL_PASSWORD"))
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