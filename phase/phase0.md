You are a senior Laravel 12 system architect.

Design a complete blueprint for a personal cloud drive system.

This project MUST include:
- Drag & drop upload
- Direct upload on dashboard
- Create folder
- Move folder
- Move file
- Soft delete (trash)
- Upload progress
- Download progress
- Multiple upload (max 100MB per file)
- Upload pause/resume
- Multiple download using queued ZIP
- File preview (simple but detailed)
- Toggle view (list/grid)
- Mandatory public share
- Local storage: MinIO
- Production/public storage: Backblaze B2

IMPORTANT:
Preview must support:
- Images
- PDF
- Video (HTML5)
- Text files

Download system:
- Must use queue for large downloads
- Must provide frontend progress indicator

Storage rule:
- Files stored using UUID filenames
- Physical storage path NOT tied to folder tree
- Folder structure only exists in database

Explain:
1) System architecture diagram (text)
2) Data flow (upload, preview, share, trash, zip)
3) Storage separation (MinIO vs Backblaze)
4) Queue responsibilities
5) Why pause/resume requires chunked upload strategy
6) Phase breakdown summary
7) Risk analysis
8) Production readiness checklist

Do NOT output code.
Architectural explanation only.