import uuid

def create_uuid():
    result = uuid.uuid4()
    result = result.int
    print("my uuid is :",result)

    return result