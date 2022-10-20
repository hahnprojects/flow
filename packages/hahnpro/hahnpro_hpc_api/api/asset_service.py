from typing.io import IO

from .http_client import HttpClient


class AssetService:
    def __init__(self, http_client: HttpClient):
        self.http_service = http_client
        self.base_path = '/assets'

    # addAttachment
    def get_one(self, id: str, options={}):
        params = {} if ('populate' not in options) else {"populate": options["populate"]}
        return self.http_service.get(f'{self.base_path}/{id}', params).json()

    def add_attachment(self, id: str, file: IO):
        return self.http_service.upload(f'{self.base_path}/{id}/attachment', file).json()
