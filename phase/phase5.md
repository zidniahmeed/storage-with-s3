You are a performance and queue optimization expert.

Implement advanced download system and system optimization.

OBJECTIVE:
Enable large multi-file download using queue with progress tracking.

IMPLEMENT:

1) ZIP generation job:
- Stream files into ZIP
- Do NOT load all into memory
- Store temp zip in storage/temp
- Save job status in database
- Provide progress percentage

2) Frontend:
- Poll job status endpoint
- Display download progress
- Auto-trigger download when ready

3) Optimize:
- Cache folder tree in Redis
- Avoid N+1 queries
- Index critical columns
- Use eager loading
- Avoid unnecessary S3 HEAD requests

4) Storage optimization:
- Explain Backblaze cost structure
- Explain PUT/GET reduction strategy
- Explain CDN optional usage

5) Add:
- Storage quota tracking
- Activity log (upload/delete/share)
- Rate limit upload/share routes

6) Production checklist:
- Queue worker running
- Scheduler running
- Horizon optional
- ENV config example
- MinIO local setup note
- B2 configuration note

OUTPUT:
- ZIP job code
- Job status API
- Optimization checklist
- Cost explanation
- Production deployment checklist