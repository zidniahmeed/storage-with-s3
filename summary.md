# Project Summary: Family Storage

## Overview
This project is a personal cloud drive system built with Laravel 12 (backend) and React (frontend). It features folder/file management, multipart uploads, a trash system, and public file sharing.

## Phase 1: Core Data Model & Foundation
- **Models**: `User`, `Folder`, `File`, `Share`.
- **Database**: Migrations for folders, files, and shares with `SoftDeletes`.
- **Policies**: Auth-based access control for all resources.
- **UI**: Breadcrumbs, grid/list view, folder creation, file moving, and basic navigation.

## Phase 2: Multipart Upload (High Performance)
- **Backend**: `UploadController` for multipart initialization, part signing, and completion.
- **Frontend**: `FileUpload` component with support for:
    - Large files (chunked into 5MB parts).
    - Pause/Resume functionality.
    - Progress tracking.
- **Storage**: MinIO (local) and S3 compatibility.

## Phase 3: Trash System
- **Soft Delete**: Integrated across folders and files.
- **Management**: Dedicated Trash page for restoring items or permanent deletion.
- **Recursive Restore**: Restoring a folder restores all its content recursively.
- **Auto Purge**: Artisan command `drive:purge-trash` to delete items older than 30 days.

## Phase 4: Public Sharing System
- **Mandatory Public Links**: `GET /s/{uuid}` for unauthenticated access.
- **Features**:
    - Optional password protection.
    - Optional expiration date.
    - Max download limit.
- **Views**: Dedicated public view for files and folders.

## Phase 5: Download & Optimization
- **Folder ZIP**: Background ZIP generation using `ZipFolderJob`.
- **Queueing**: Status tracking (`pending`, `processing`, `completed`, `failed`).
- **Optimization**: Use of `StreamingResponse` (via `Storage::download`) for efficient delivery of large files.

## Summary of Completed Tasks
1. Scaffolding Laravel 12 with Breeze & React.
2. Implementing the database schema and Eloquent models.
3. Building the Dashboard with breadcrumbs and file navigation.
4. Implementing the multipart upload manager with pause/resume.
5. Creating the Trash system with recursive restoration.
6. Implementing the public sharing system with password and expiration.
7. Adding background ZIP generation for folders.
8. Provided project documentation in `summary.md`.
9. Managed all dependencies (AWS SDK for S3, etc).
