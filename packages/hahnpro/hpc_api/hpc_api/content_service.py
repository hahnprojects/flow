from .http_client import HttpClient


class ContentService:

    def __init__(self, http_client: HttpClient):
        self.http_client = http_client
        self.base_path = '/contents'

    def get_one(self, id: str, options={}):
        params = {} if ('populate' not in options) else {"populate": options["populate"]}
        return self.http_client.get(f'{self.base_path}/{id}', params).json()

    def delete_one(self, id):
        return self.http_client.delete(f'{self.base_path}/{id}').json()

    def download(self, id: str):
        return self.http_client.get(f'{self.base_path}/{id}/download', {}).content
