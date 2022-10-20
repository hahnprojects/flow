import time


class TokenSet:
    def __init__(self, access_token: str, expires_in: int):
        self.access_token = access_token
        self.expires_in = expires_in

    @property
    def expires_in(self):
        return max(self.expires_at - time.time(), 0)

    @expires_in.setter
    def expires_in(self, value):
        self.expires_at = time.time() + value

    def expired(self):
        return self.expires_in == 0

