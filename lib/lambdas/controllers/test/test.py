import requests

def handler(e,ctx):
    print(requests.__version__)

    resp = {
        "statusCode": 200,
        "body": requests.__version__
    }

    return resp