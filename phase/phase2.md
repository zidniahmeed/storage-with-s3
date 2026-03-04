You are an S3 upload optimization expert.

Implement advanced upload system with:

- Max file size 100MB
- Multiple upload
- Drag & drop
- Upload progress
- Pause
- Resume
- Direct-to-S3 (MinIO local, B2 production)

IMPORTANT:
Pause/resume requires chunked upload strategy.

IMPLEMENT:

1) Use multipart upload approach.
2) Frontend splits file into chunks (e.g., 5MB each).
3) Upload chunks with concurrency 3–5.
4) Store upload session state.
5) Resume from last successful chunk.
6) AbortController support.

Backend:
- Endpoint to initialize multipart upload
- Endpoint to sign each part
- Endpoint to complete multipart upload
- Store metadata after completion

Validate:
- Max 100MB
- Mime whitelist

Explain:
- Why multipart enables pause/resume
- Memory safety benefits
- Why backend should not proxy file

OUTPUT:
- Controller endpoints
- S3 config example
- React upload manager logic
- Chunk flow diagram (text)