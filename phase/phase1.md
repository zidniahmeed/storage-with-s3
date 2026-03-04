You are a Laravel 12 architect.

Implement Phase 1 for the personal drive system.

OBJECTIVE:
Build folder and file management foundation Using Breeze starkit with laravel 12 and ReactJs

REQUIREMENTS:

1) Database tables:

folders:
- id
- user_id
- parent_id
- name
- softDeletes
- timestamps
Index: (user_id, parent_id)

files:
- id
- user_id
- folder_id
- name (UUID filename)
- original_name
- mime_type
- size
- disk (minio or b2)
- path
- softDeletes
- timestamps

shares:
- id
- uuid
- user_id
- shareable_type (morph)
- shareable_id
- permission (view/download)
- password (nullable hashed)
- expires_at (nullable)
- max_downloads (nullable)
- download_count
- timestamps

2) Folder strategy:
Use Adjacency List (parent_id).
Explain why better than nested set.

3) Implement:
- Create folder
- Rename folder
- Move folder
- Move file
- Toggle list/grid view (frontend)
- Breadcrumb navigation

4) File preview system:
Implement simple preview route:
- Image (img tag)
- PDF (iframe)
- Video (HTML5 video)
- Text (stream + display)

5) Strict user isolation via policy.

6) SoftDeletes enabled but no purge yet.

OUTPUT:
- Migration code
- Model relationships
- Controller
- Policy
- React structure
- Preview route logic