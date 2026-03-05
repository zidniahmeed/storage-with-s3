# Family Storage

A modern, fast, and feature‑rich private cloud storage built with **Laravel 12.53.0**, **React**, **Inertia.js**, and **Tailwind CSS**. Designed as a private family/personal drive with S3‑compatible backend storage.

---

## Features

### Progressive Web App (PWA)
- Installable on mobile (iOS/Android) and desktop devices.
- Offline fallback capability.
- Caching strategies for faster, native‑like load times.

### Private & Secure
- Invite‑only system: public registration is disabled. Only the owner can create users.
- Secure login with a modern glassmorphism UI design.

### Advanced File Management
- Nested folders: create unlimited nested folder structures.
- Chunked file uploads: upload massive files without hitting PHP timeout limits; chunks are sent directly to the storage backend.
- Bulk operations: select multiple files/folders to move, delete, or download (as ZIP) simultaneously.
- Trash & recovery: soft‑delete files and folders, with easy restore or permanent empty.
- Dynamic views: toggle between grid and list layouts.
- Lazy loading: high‑performance scrolling using Intersection Observer. Skeleton shimmers indicate loading states before fading in the actual content.

### Inline File Previews
- Native browser streaming: preview images, videos, audio, and PDFs directly in the browser without downloading.

### Secure Public Sharing
- Share files and folders via public URLs.
- Password protection for shared links.
- Expiration dates to automatically disable links after a set time.
- Download limits to restrict the number of times a link can be used.
- Public previews: recipients can view images, videos, audio, and PDFs directly from the shared link without an account.

### Storage Monitoring
- Real‑time dashboard widget showing total used storage capacity and file count.

---

## Tech Stack
- **Backend**: Laravel 12.53.0, PHP 8.2+
- **Frontend**: React 18, Inertia.js (v2), Tailwind CSS
- **Storage Backend**: AWS S3, MinIO, or Backbase (any S3‑compatible object storage)
- **Database**: MySQL / PostgreSQL / SQLite

---

## Setup & Installation

### Prerequisites
- PHP 8.2 or higher
- Composer
- Node.js & npm
- MinIO server (for local development)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/family-storage.git
cd family-storage

# Install PHP dependencies
composer install

# Install npm dependencies
npm install
```

### 2. Configure Environment (`.env`)
Copy the environment template and generate an app key:
```bash
cp .env.example .env
php artisan key:generate
```
Edit the `.env` file with your database credentials.

### 3. Database Migration
```bash
php artisan migrate
```
*(Create an initial user manually via `php artisan tinker` because registration is disabled.)*

---

## Storage Configuration

The application uses **S3‑compatible** storage.

### Option A: Local Development with MinIO
1. Start MinIO server:
```bash
minio server ~/minio-data --console-address ":9001"
```
2. Add the following to your `.env` (replace the keys with those printed by MinIO):
```ini
FILESYSTEM_DISK=s3

AWS_ACCESS_KEY_ID=your-minio-access-key
AWS_SECRET_ACCESS_KEY=your-minio-secret-key
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=family-storage
AWS_URL=http://localhost:9000/family-storage
AWS_ENDPOINT=http://localhost:9000
AWS_USE_PATH_STYLE_ENDPOINT=true
```
Create a bucket named `family-storage` in the MinIO console and set its policy to public if needed.

### Option B: Online Deployment (AWS S3 / Backbase)
Add the typical S3 configuration to `.env`:
```ini
FILESYSTEM_DISK=s3

AWS_ACCESS_KEY_ID=your-cloud-access-key
AWS_SECRET_ACCESS_KEY=your-cloud-secret-key
AWS_DEFAULT_REGION=ap-southeast-1
AWS_BUCKET=your-bucket-name
AWS_URL=https://your-bucket-name.s3.ap-southeast-1.amazonaws.com
AWS_ENDPOINT=https://s3.ap-southeast-1.amazonaws.com
AWS_USE_PATH_STYLE_ENDPOINT=false
```
Make sure the bucket’s CORS settings allow multipart uploads from your domain.

---

## Running the Application

Open two terminals:

**Backend**
```bash
php artisan serve
```
**Frontend (Vite HMR)**
```bash
npm run dev
```
Visit the URL shown (usually `http://localhost:8000`).

### Building for Production
```bash
npm run build
```
This compiles assets and generates the service worker for the PWA.

---

## UI/UX Highlights
- Glassmorphism login page with subtle gradients.
- Synchronized dropdowns that close when clicking outside.
- Contextual animations for a smooth user experience.

## Screenshots

![Dashboard view](/Users/zidni/Herd/family-storage/screenshot/dashboard.png)
*Dashboard overview with file grid.*

![Upload queue](/Users/zidni/Herd/family-storage/screenshot/upload-queue.png)
*Upload queue showing progress of chunked uploads.*

![Mobile view](/Users/zidni/Herd/family-storage/screenshot/mobile-view.png)
*Responsive mobile layout.*

---

*Family Storage – a premium, private cloud storage solution.*
