import boto3
import logging
import os
from dotenv import load_dotenv
import redis
import json


load_dotenv()
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')

session = boto3.Session(
    aws_access_key_id = AWS_ACCESS_KEY_ID,
    aws_secret_access_key = AWS_SECRET_ACCESS_KEY,
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logging.basicConfig(level=logging.ERROR, format='%(asctime)s - %(levelname)s - %(message)s')
redis_client = None
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0)
except Exception as e:
    logging.error(e)
    redis_client = None

def list_bucket():
    if redis_client is not None:
        cache_key = "s3_buckets"
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return json.loads(cached_data)

    try:
        s3 = session.resource('s3')
        buckets = [bucket.name for bucket in s3.buckets.all()]
        if redis_client is not None:
            redis_client.setex(cache_key, 3600, json.dumps(buckets))  # 快取 1 小時
        return buckets
    except Exception as e:
        logging.error(e)
        return []

def create_bucket(bucket_name, region=None):
    try:
        if region is None or region == 'us-east-1':  
            s3_client = session.client('s3')
            s3_client.create_bucket(Bucket=bucket_name)
        else:
            s3_client = session.client('s3', region_name = region)
            s3_client.create_bucket(Bucket=bucket_name, CreateBucketConfiguration={'LocationConstraint': region})
    except Exception as e:
        logging.error(e)
        print(e)
        return False
    return True

def upload_file(file_name, bucket, object_name=None):
    if object_name is None:
        object_name = os.path.basename(file_name)
    try:
        s3_client = session.client('s3')
        response = s3_client.upload_file(file_name, bucket, object_name)
        if redis_client is not None:
            redis_client.delete(f"s3_folder_images:{bucket}")
    except Exception as e:
        logging.error(e)
        print(e)
        return False
    logging.info("Upload {} to {}:{} success.".format(file_name, bucket, object_name))
    return True

def download_file(save_file_path, bucket, object_name=None):
    if object_name is None:
        object_name = os.path.basename(save_file_path)
    try:
        s3_client = session.client('s3')
        response = s3_client.download_file(bucket, object_name, save_file_path)
    except Exception as e:
        logging.error(e)
        print(e)
        return False
    logging.info("Download {} from {}:{} success.".format(save_file_path, bucket, object_name))
    return True

def delete_file(bucket, object_name):
    try:
        s3_client = session.client('s3')
        response = s3_client.delete_object(Bucket=bucket, Key=object_name)
        if redis_client is not None:
            redis_client.delete(f"s3_folder_images:{bucket}")
    except Exception as e:
        logging.error(e)
        print(e)
        return False
    logging.info("Delete {} from {}:{} success.".format(object_name, bucket, object_name))
    return True

def delete_bucket(bucket):
    try:
        s3_client = session.client('s3')
        response = s3_client.delete_bucket(Bucket=bucket)
    except Exception as e:
        logging.error(e)
        print(e)
        return False
    logging.info("Delete {} success.".format(bucket))
    return True

def create_folder(bucket, folder):
    try:
        s3_client = session.client('s3')
        response = s3_client.put_object(Bucket=bucket, Key=folder)
        if redis_client is not None:
            redis_client.delete(f"s3_folders:{bucket}")
            redis_client.delete(f"s3_folder_images:{bucket}")
    except Exception as e:
        logging.error(e)
        print(e)
        return False
    logging.info("Create {} success.".format(folder))
    return True

def upload_photo_to_folder(bucket, folder, photo):
    try:
        filename = photo.split('/')[2]
        s3_client = session.client('s3')
        response = s3_client.upload_file(photo, bucket, f"{folder}/{filename}")
        if redis_client is not None:
            redis_client.delete(f"s3_folders:{bucket}")
            redis_client.delete(f"s3_folder_images:{bucket}")
    except Exception as e:
        logging.error(e)
        print(e)
        return False
    logging.info("Upload {} to {}:{} success.".format(photo, bucket, folder))
    return True

def list_folder_name_in_bucket(bucket):
    if redis_client is not None:
        cache_key = f"s3_folders:{bucket}"
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return json.loads(cached_data)

    try:
        s3_client = session.client('s3')
        response = s3_client.list_objects(Bucket=bucket, Delimiter='/')
        folders = [prefix['Prefix'].rstrip('/') for prefix in response.get('CommonPrefixes', [])]
        if redis_client is not None:
            redis_client.setex(cache_key, 3600, json.dumps(folders))  # 快取 1 小時
        return folders
    except Exception as e:
        logging.error(e)
        return []

def list_images_in_folders(bucket, *folders):
    s3_client = boto3.client('s3')
    images = []
    
    for folder in folders:
        try:
            response = s3_client.list_objects(Bucket=bucket, Prefix=folder)
            folder_images = []
            
            for item in response.get('Contents', []):
                if item['Key'].endswith('/'):
                    continue
                else:
                    item['Key'] = item['Key'].split("/")
                    folder_images.append(item['Key'][1])
            images.append(folder_images)
            logging.info(f"List images in folder '{folder}' success.")
        except Exception as e:
            logging.error(f"Error listing images in folder '{folder}': {e}")
            images[folder] = False  
    print(images)
    return images

def get_folder_and_images(bucket):
    redis_available = False
    if redis_client is not None:
        try:
            cache_key = f"s3_folder_images:{bucket}"
            cached_data = redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
            redis_available = True
        except redis.exceptions.ConnectionError:
            logging.error("Redis connection failed, proceeding without caching")

    try:
        s3_client = session.client('s3')
        response = s3_client.list_objects(Bucket=bucket, Delimiter='/')
        folders = [prefix['Prefix'].rstrip('/') for prefix in response.get('CommonPrefixes', [])]
        
        results = {}
        for folder in folders:
            response = s3_client.list_objects(Bucket=bucket, Prefix=folder + '/')
            images = [item['Key'].split('/')[-1] for item in response.get('Contents', []) if not item['Key'].endswith('/')]
            results[folder] = images
        if redis_available == True:
            try:
                redis_client.setex(cache_key, 3600, json.dumps(results))  # 快取 1 小時
            except redis.exceptions.ConnectionError:
                logging.error("Failed to cache results in Redis")
        return results
    except Exception as e:
        logging.error(e)
        return {"error": e}
#create_bucket("examplebucket10101010", region = "us-east-1")
#list_bucket()
#upload_file("C:\\Users\\kawam\\Pictures\\hoohoo.png", "examplebucket10101010","hoohoo.png")
#download_file("./hoohoo.png", "examplebucket10101010","hoohoo.png")
#delete_file("examplebucket10101010","collage.jpg")
#delete_bucket("examplebucket99999999")

#upload_photo_to_folder("examplebucket10101010", "test", "./tmp/collage.jpg")
#create_folder("examplebucket10101010", "hello/")
#list_image_in_folder("examplebucket10101010", "路易十六宴會廳/")
#list_folder_name_in_bucket("examplebucket10101010")
#get_folder_and_images("examplebucket10101010")
#list_images_in_folders("examplebucket10101010", "IKEA展示間", "本能寺會客室", "紫色妙妙會議室", "路易十六宴會廳")
'''[['4ce7372d-223a-4583-b436-094dd4447d08.jpg', 'ed89f28b-33ca-4575-baac-a407c0d72a9b.jpg'], 
['2d0001c7-f1af-4368-b8b7-1eefd0332a50.jpg', 'ab35ad12-8fa6-487a-8546-fd0323a36576.jpg', 'c2f58e86-3c61-4347-a59f-cc3de85477f1.jpg', 'e5a2b09e-3fa3-4567-9fe4-d6ea5f5cd5ed.jpg'], 
['668cd845-85f2-47ec-acce-619a8d454f01.jpg'], ['3873b00e-d527-4665-b8cb-d0d7fbe2a399.jpg', '538ac09d-dbaa-4393-a111-4097ad63ac02.jpg']]
'''