import os
from .http_client import HttpClient
from .asset_service import AssetService
from .content_service import ContentService


class API:
    def __init__(self):
        def normalize_path(value: str, default_value: str):
            return default_value if value is None else value.strip('/')

        api_base_url = os.getenv('API_BASE_URL', 'https://testing.hahnpro.com')
        if not api_base_url.startswith('https') and not api_base_url.startswith('http'):
            print('no protocol specified - using HTTPS')
            api_base_url = f'https://{api_base_url}'

        api_url = f'{api_base_url}/{normalize_path(os.getenv("API_BASE_PATH"), "api")}'
        auth_base_url = os.getenv('AUTH_BASE_URL', api_base_url)
        auth_url = f'{auth_base_url}/{normalize_path(os.getenv("AUTH_BASE_PATH"), "auth")}'
        realm = os.getenv('AUTH_REALM', 'hpc')
        client = os.getenv('API_USER', 'flow-executor-service')
        secret = os.getenv('AUTH_SECRET')
        if not secret:
            raise ValueError('"API_BASE_URL", "API_USER", "AUTH_REALM" and "AUTH_SECRET" environment variables must be set')

        self.http_client = HttpClient(api_url, auth_url, realm, client, secret)

        self.asset_service = AssetService(self.http_client)
        self.content_service = ContentService(self.http_client)
