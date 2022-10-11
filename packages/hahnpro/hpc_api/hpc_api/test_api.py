import os
import unittest
from .api import API


class APITestCase(unittest.TestCase):

    def test_create(self):
        os.environ["API_BASE_URL"] = 'https://testing.hahnpro.com'
        os.environ["AUTH_REALM"] = 'testing'
        os.environ["API_USER"] = 'e2e-test-client'
        api = API()
        self.assertTrue(api)
