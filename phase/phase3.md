You are a Laravel reliability engineer.

Implement full trash system.

REQUIREMENTS:

1) SoftDeletes already active.
2) Trash view (separate page).
3) Restore folder recursively.
4) Restore file.
5) Permanent delete manually.
6) Auto purge after 30 days.

Create:
- Artisan command: drive:purge-trash
- Scheduled daily execution

Purge logic:
- deleted_at <= now()->subDays(30)
- Delete physical object from disk (MinIO/B2)
- Force delete DB record
- Use chunk processing
- Use queue for large purge

Important:
- Prevent orphaned S3 objects
- Handle nested folder purge safely
- Log purge summary

OUTPUT:
- Purge command code
- Scheduler config
- Recursive restore logic
- Safety explanation