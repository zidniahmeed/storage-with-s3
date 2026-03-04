<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Folder;
use App\Models\File;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class TrashController extends Controller
{
    use AuthorizesRequests;

    public function index()
    {
        $userId = Auth::id();

        $folders = Folder::onlyTrashed()
            ->where('user_id', $userId)
            ->get();

        $files = File::onlyTrashed()
            ->where('user_id', $userId)
            ->get();

        return Inertia::render('Trash', [
            'folders' => $folders,
            'files' => $files,
        ]);
    }

    public function restoreFolder(Request $request, $id)
    {
        $folder = Folder::onlyTrashed()->findOrFail($id);
        $this->authorize('restore', $folder);

        $this->recursiveRestore($folder);

        return back();
    }

    protected function recursiveRestore(Folder $folder)
    {
        $folder->restore();

        // Restore child folders
        Folder::onlyTrashed()
            ->where('parent_id', $folder->id)
            ->get()
            ->each(fn($child) => $this->recursiveRestore($child));

        // Restore child files
        File::onlyTrashed()
            ->where('folder_id', $folder->id)
            ->restore();
    }

    public function restoreFile(Request $request, $id)
    {
        $file = File::onlyTrashed()->findOrFail($id);
        $this->authorize('restore', $file);

        $file->restore();

        return back();
    }

    public function destroyFolder($id)
    {
        $folder = Folder::onlyTrashed()->findOrFail($id);
        $this->authorize('forceDelete', $folder);

        $this->recursivePermanentDelete($folder);

        return back();
    }

    protected function recursivePermanentDelete(Folder $folder)
    {
        // Delete child folders
        Folder::onlyTrashed()
            ->where('parent_id', $folder->id)
            ->get()
            ->each(fn($child) => $this->recursivePermanentDelete($child));

        // Delete child files
        File::onlyTrashed()
            ->where('folder_id', $folder->id)
            ->get()
            ->each(fn($file) => $this->permanentDeleteFile($file));

        $folder->forceDelete();
    }

    public function destroyFile($id)
    {
        $file = File::onlyTrashed()->findOrFail($id);
        $this->authorize('forceDelete', $file);

        $this->permanentDeleteFile($file);

        return back();
    }

    protected function permanentDeleteFile(File $file)
    {
        Storage::disk($file->disk)->delete($file->path);
        $file->forceDelete();
    }

    public function emptyTrash()
    {
        $userId = Auth::id();

        // Recursively delete all trashed folders
        Folder::onlyTrashed()
            ->where('user_id', $userId)
            ->get()
            ->each(fn($folder) => $this->recursivePermanentDelete($folder));

        // Delete all trashed files
        File::onlyTrashed()
            ->where('user_id', $userId)
            ->get()
            ->each(fn($file) => $this->permanentDeleteFile($file));

        return back();
    }
}
