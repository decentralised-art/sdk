from __future__ import annotations

import json
import unittest

import httpx
from eth_account import Account
from eth_account.messages import encode_defunct

from decentralised_art.client import Client
from fixtures import ADDR, NONCE, SIGN_IN_MESSAGE, ApiRouter


class TestDecentralisedArtAuth(unittest.TestCase):
    def setUp(self) -> None:
        self.router = ApiRouter()
        self.client = Client(
            base_url="https://example.invalid/chain",
            transport=httpx.MockTransport(self.router),
        )

    def last_request(self) -> httpx.Request:
        return self.router.requests[-1]

    def test_get_nonce_returns_the_sign_in_message_and_passes_origin(self) -> None:
        issued = self.client.get_nonce(ADDR, origin="https://example.invalid")
        self.assertEqual((issued.nonce, issued.message), (NONCE, SIGN_IN_MESSAGE))
        self.assertEqual(
            self.last_request().url.params.get("origin"), "https://example.invalid"
        )

    def test_login_with_signature_sets_token_and_posts_auth_body(self) -> None:
        out = self.client.login_with_signature(ADDR, NONCE, "0xSIG")
        self.assertEqual(out.access_token, "access-123")
        self.assertEqual(self.client.access_token, "access-123")

        request = self.last_request()
        self.assertNotIn("authorization", request.headers)
        self.assertEqual(
            json.loads(request.content.decode()),
            {"address": ADDR, "nonce": NONCE, "signature": "0xSIG"},
        )

    def test_login_with_account_signs_the_issued_message(self) -> None:
        account = Account.create()
        out = self.client.login_with_account(account)
        self.assertEqual(out.access_token, "access-123")
        self.assertEqual(self.client.access_token, "access-123")

        body = json.loads(self.last_request().content.decode())
        self.assertEqual((body["address"], body["nonce"]), (account.address, NONCE))
        recovered = Account.recover_message(
            encode_defunct(text=SIGN_IN_MESSAGE),
            signature=body["signature"],
        )
        self.assertEqual(recovered, account.address)


if __name__ == "__main__":
    unittest.main()
