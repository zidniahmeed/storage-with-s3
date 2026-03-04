You are a security-focused Laravel architect.

Implement mandatory public sharing system.

REQUIREMENTS:

1) Share creation:
User can generate link with:
- Optional expiration
- Optional password
- Optional max download limit

2) Public route:
GET /s/{uuid}

No authentication required.

3) Validation:
- Exists
- Not expired
- Download limit not exceeded
- Password validated if set

4) If share is file:
- Preview
- Download

5) If share is folder:
- Read-only file listing
- Individual file download
- Queue ZIP download for full folder

6) Security:
- UUID v4
- Password hashed
- Atomic download_count increment
- Rate limiting
- Prevent enumeration attack
- Signed temporary download URL for B2

7) Frontend:
Public ShareView page.

OUTPUT:
- Share controller
- Route definitions
- Validation logic
- Security explanation