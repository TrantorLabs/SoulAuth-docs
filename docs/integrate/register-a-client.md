# Register a client

Every OIDC integration starts here. Registering a client requires
`soulauth:oidc_clients.write`, which only `admin` holds by default.

```bash
curl -X POST $SOULAUTH/api/oidc/clients \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "client_name": "Demo App",
    "client_type": "confidential",
    "redirect_uris": ["http://localhost:3000/callback"],
    "allowed_grant_types": ["authorization_code", "refresh_token"],
    "allowed_scopes": ["openid", "profile", "email"]
  }'
```

```json
{
  "client_id": "client_1787796518211crEBwUSf",
  "client_secret": "OJFawoLENnseRQKvyJBOjAeOtW881Tinm2div3XnMkLhpSz2sN29RSw1ebKG13OM",
  "client_name": "Demo App",
  "client_type": "confidential",
  "redirect_uris": ["http://localhost:3000/callback"],
  "post_logout_redirect_uris": [],
  "allowed_scopes": ["openid", "profile", "email"],
  "allowed_grant_types": ["authorization_code", "refresh_token"],
  "allowed_response_types": ["code"],
  "require_pkce": true,
  "access_token_lifetime": 3600,
  "refresh_token_lifetime": 86400,
  "id_token_lifetime": 300,
  "is_active": true,
  "created_at": 1787796518,
  "updated_at": 1787796518
}
```

::: danger This is the only time you see the secret
`client_secret` is stored as a hash. It is returned once, here. Listing clients later
returns everything **except** the secret. The API has only the hash, so there is nothing
readable left to return.

Lost it? `POST /api/oidc/clients/{client_id}/regenerate-secret` issues a new one and
invalidates the old.
:::

## confidential or public

The one decision that matters:

| | Use when | Consequence |
|---|---|---|
| `confidential` | Your server keeps the secret — a backend, a BFF, a server-rendered app | The token endpoint requires the secret. A browser-side app **cannot** be one, because shipping a secret to a browser publishes it. |
| `public` | Native app, SPA with no backend | No secret. PKCE is the only thing preventing code interception, which is why it is not optional. |

`require_pkce` is **forced on** for a `public` client — send `false` and the server
overrides it, because PKCE is that client's only binding to the code. For a
`confidential` client it defaults to on and you *may* turn it off; the client secret is a
second binding, which is why the choice exists at all.

Turn it off only if you have a reason you can state. The secret being there is not one.

Whenever PKCE is in play, only `S256` is accepted — `plain` is rejected at the authorize
step, since a `plain` challenge equals the verifier and stops nothing.

## Redirect URIs

Matched **exactly** — full string, no wildcards, no prefix matching. Register every
environment you use:

```json
"redirect_uris": [
  "http://localhost:3000/callback",
  "https://app.example.com/callback"
]
```

This is the single most security-relevant field on a client. Whoever can change it can
redirect a valid authorization code to themselves, which is why editing clients needs
`.write` and the permission is granted narrowly.

## Managing clients

```bash
# List (never returns secrets)
curl $SOULAUTH/api/oidc/clients -H "Authorization: Bearer $ADMIN_TOKEN"

# Update — PUT reuses the create request body, so client_name, client_type and
# redirect_uris are all required. Send the full object, not just the field you changed.
curl -X PUT $SOULAUTH/api/oidc/clients/$CLIENT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"client_name":"My App","client_type":"confidential",
       "redirect_uris":["https://app.example.com/callback"]}'

# Disable — the record stays, so tokens already issued remain attributable
curl -X DELETE $SOULAUTH/api/oidc/clients/$CLIENT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Full endpoint list: [OIDC & clients](/reference/oidc-and-clients).

## Next

[Run the Authorization Code flow →](/integrate/authorization-code-flow)
