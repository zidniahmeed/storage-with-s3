<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\FolderController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\PreviewController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\TrashController;
use App\Http\Controllers\ShareController;
use App\Http\Controllers\StorageController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard/{folder?}', [FolderController::class, 'index'])->name('dashboard');

    Route::get('/folders/download-zip/{folder}', [FolderController::class, 'downloadZip'])->name('folders.download-zip');
    Route::get('/folders/zip-status/{folder}', [FolderController::class, 'zipStatus'])->name('folders.zip-status');
    Route::resource('folders', FolderController::class)->except(['index', 'show']);
    Route::post('/folders/{folder}/move', [FolderController::class, 'move'])->name('folders.move');

    Route::delete('/files/{file}', [FileController::class, 'destroy'])->name('files.destroy');
    Route::get('/files/{file}/download', [FileController::class, 'download'])->name('files.download');
    Route::post('/files/{file}/move', [FolderController::class, 'moveFile'])->name('files.move');

    Route::post('/upload/init', [UploadController::class, 'init'])->name('upload.init');
    Route::post('/upload/sign-part', [UploadController::class, 'signPart'])->name('upload.sign-part');
    Route::post('/upload/complete', [UploadController::class, 'complete'])->name('upload.complete');

    Route::get('/preview/{file}', [PreviewController::class, 'show'])->name('preview.show');

    Route::get('/trash', [TrashController::class, 'index'])->name('trash.index');
    Route::post('/trash/folders/{id}/restore', [TrashController::class, 'restoreFolder'])->name('trash.folders.restore');
    Route::post('/trash/files/{id}/restore', [TrashController::class, 'restoreFile'])->name('trash.files.restore');
    Route::delete('/trash/folders/{id}', [TrashController::class, 'destroyFolder'])->name('trash.folders.destroy');
    Route::delete('/trash/files/{id}', [TrashController::class, 'destroyFile'])->name('trash.files.destroy');
    Route::delete('/trash/empty', [TrashController::class, 'emptyTrash'])->name('trash.empty');

    Route::post('/shares', [ShareController::class, 'store'])->name('shares.store');

    Route::post('/bulk/download', [FolderController::class, 'bulkDownload'])->name('bulk.download');
    Route::post('/bulk/move', [FolderController::class, 'bulkMove'])->name('bulk.move');
    Route::get('/bulk/download-zip/{zipName}', [FolderController::class, 'bulkDownloadZip'])->name('bulk.download-zip');
    Route::get('/bulk/download-status/{zipName}', [FolderController::class, 'bulkDownloadStatus'])->name('bulk.download-status');
});

Route::get('/s/{uuid}', [ShareController::class, 'show'])->name('shares.show');
Route::post('/s/{uuid}/auth', [ShareController::class, 'authenticate'])->name('shares.auth');
Route::get('/s/{uuid}/download/{file?}', [ShareController::class, 'download'])->name('shares.download');
Route::get('/s/{uuid}/preview/{file?}', [ShareController::class, 'preview'])->name('shares.preview');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/api/storage/summary', [StorageController::class, 'summary'])->name('storage.summary');
});

require __DIR__ . '/auth.php';
