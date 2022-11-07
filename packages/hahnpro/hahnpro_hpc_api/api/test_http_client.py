import os
import unittest
from .http_client import HttpClient


class HttpClientTestCase(unittest.TestCase):

    def test_get_access_token(self):
        http_client = HttpClient(
            'https://testing.hahnpro.com',
            'https://testing.hahnpro.com/auth',
            'testing',
            'e2e-test-client',
            os.environ["AUTH_SECRET"]
        )
        self.assertTrue(http_client.get_access_token())


if __name__ == '__main__':
    unittest.main()
