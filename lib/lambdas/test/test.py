from dremio.flight.endpoint import DremioFlightEndpoint

def handler(e,ctx):
    print(DremioFlightEndpoint)

    resp = {
        "statusCode": 200,
        "body": str("Hello")
    }

    return resp