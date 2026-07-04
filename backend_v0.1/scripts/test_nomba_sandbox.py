import asyncio, sys
from integrations.nomba_client import NombaAPIClient, NombaVirtualAccountRequest

async def main():
    client = NombaAPIClient()
    client.base_url = 'https://sandbox.nomba.com'

    req = NombaVirtualAccountRequest(accountRef='test-ref-123', accountName='Test User')
    try:
        res = await client.create_user_virtual_account(req)
        print('RES_CODE:', res.code)
        print('RES_DESC:', res.description)
        print('RES_DATA:', res.data)
    except Exception as e:
        print('ERR:', repr(e), file=sys.stderr)

asyncio.run(main())
