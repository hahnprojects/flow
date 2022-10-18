import requests
from authlib.oauth2.rfc7523 import ClientSecretJWT
from authlib.integrations.requests_client import OAuth2Session
from typing.io import IO

from .token_set import TokenSet


class HttpClient:

    def __init__(self, base_url: str, auth_base_url: str, realm: str, client_id: str, client_secret: str):
        self.token_set: TokenSet = None
        self.base_url = base_url
        self.auth_base_url = auth_base_url
        self.realm = realm
        self.client_id = client_id
        self.client_secret = client_secret

    def get_access_token(self):
        if self.token_set is None or self.token_set.expired():
            return self.request_access_token()
        return self.token_set.access_token

    def request_access_token(self):
        token_endpoint = f'{self.auth_base_url}/realms/{self.realm}/protocol/openid-connect/token'
        session = OAuth2Session(
            self.client_id,
            self.client_secret,
            token_endpoint_auth_method='client_secret_jwt',
            scope='openid'
        )
        session.register_client_auth_method(ClientSecretJWT(token_endpoint))
        result = session.fetch_token(token_endpoint)
        token = result["access_token"]
        self.token_set = TokenSet(token, result["expires_in"])
        return token

    def get(self, url: str, params: {}):
        headers = {"Authorization": f'Bearer {self.get_access_token()}'}
        return requests.get(f'{self.base_url}{url}', params=params, headers=headers)

    def delete(self, url: str):
        headers = {"Authorization": f'Bearer {self.get_access_token()}'}
        return requests.delete(f'{self.base_url}{url}', headers=headers)

    def upload(self, url: str, file: IO):
        headers = {"Authorization": f'Bearer {self.get_access_token()}'}
        files = {'file': file}
        return requests.post(f'{self.base_url}{url}', files=files, headers=headers)
