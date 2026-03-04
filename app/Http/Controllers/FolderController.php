<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Folder;
use App\Models\File;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Jobs\ZipFolderJob;
use Illuminate\Support\Facades\Storage;

class FolderController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request, ?Folder $folder = null)
    {
        if ($folder) {
            $this->authorize('view', $folder);
        }

        $userId = Auth::id();
        $parentId = $folder?->id;

        $folders = Folder::where('user_id', $userId)
            ->where('parent_id', $parentId)
            ->orderBy('name')
            ->get();

        $files = File::where('user_id', $userId)
            ->where('folder_id', $parentId)
            ->orderBy('original_name')
            ->get();

        $breadcrumbs = $this->getBreadcrumbs($folder);

        $allFolders = Folder::where('user_id', $userId)
            ->orderBy('name')
            ->get();

        return Inertia::render('Dashboard', [
            'folder' => $folder,
            'folders' => $folders,
            'files' => $files,
            'breadcrumbs' => $breadcrumbs,
            'allFolders' => $allFolders,
        ]);
    }

    public function downloadZip(Folder $folder)
    {
        $this->authorize('view', $folder);

        if ($folder->zip_status === 'completed' && $folder->zip_path) {
            $disk = config('filesystems.default');
            return Storage::disk($disk)->download($folder->zip_path, "{$folder->name}.zip");
        }

        if ($folder->zip_status !== 'processing') {
            $folder->update(['zip_status' => 'pending']);
            ZipFolderJob::dispatch($folder);
        }

        return response()->json(['status' => $folder->zip_status]);
    }

    public function zipStatus(Folder $folder)
    {
        $this->authorize('view', $folder);
        return response()->json([
            'status' => $folder->zip_status,
            'url' => $folder->zip_status === 'completed' ? route('folders.download-zip', $folder) : null
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:folders,id',
        ]);

        if ($request->parent_id) {
            $parent = Folder::findOrFail($request->parent_id);
            $this->authorize('view', $parent);
        }

        Auth::user()->folders()->create([
            'name' => $request->name,
            'parent_id' => $request->parent_id,
        ]);

        return back();
    }

    public function update(Request $request, Folder $folder)
    {
        $this->authorize('update', $folder);

        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $folder->update($request->only('name'));

        return back();
    }

    public function destroy(Folder $folder)
    {
        $this->authorize('delete', $folder);

        $folder->delete(); // Soft delete

        return back();
    }

    public function move(Request $request, Folder $folder)
    {
        $this->authorize('update', $folder);

        $request->validate([
            'parent_id' => 'nullable|exists:folders,id',
        ]);

        if ($request->parent_id) {
            $parent = Folder::findOrFail($request->parent_id);
            $this->authorize('view', $parent);

            // Prevent moving to self or its children (recursive check simplified for now)
            if ($folder->id == $request->parent_id) {
                abort(403, 'Cannot move folder into itself.');
            }
        }

        $folder->update(['parent_id' => $request->parent_id]);

        return back();
    }

    public function moveFile(Request $request, File $file)
    {
        $this->authorize('update', $file);

        $request->validate([
            'folder_id' => 'nullable|exists:folders,id',
        ]);

        if ($request->folder_id) {
            $folder = Folder::findOrFail($request->folder_id);
            $this->authorize('view', $folder);
        }

        $file->update(['folder_id' => $request->folder_id]);

        return back();
    }

    public function bulkDownload(Request $request)
    {
        $request->validate([
            'selection' => 'required|array',
            'selection.*.type' => 'required|string|in:file,folder',
            'selection.*.id' => 'required|integer',
        ]);

        $selection = $request->selection;
        $totalSize = 0;
        $hasFolder = false;

        foreach ($selection as $item) {
            if ($item['type'] === 'file') {
                $file = File::findOrFail($item['id']);
                $this->authorize('view', $file);
                $totalSize += $file->size;
            } else {
                $folder = Folder::findOrFail($item['id']);
                $this->authorize('view', $folder);
                $hasFolder = true;
                // Recursive size calculation (simplified)
            }
        }

        // If single file and < 50MB
        if (count($selection) === 1 && $selection[0]['type'] === 'file' && !$hasFolder && $totalSize < 50 * 1024 * 1024) {
            $file = File::find($selection[0]['id']);
            return response()->json([
                'status' => 'direct',
                'url' => route('files.download', $file)
            ]);
        }

        // Otherwise Zip it
        $zipName = 'bulk_' . Auth::id() . '_' . now()->timestamp . '_' . rand(1000, 9999);
        \App\Jobs\BulkZipJob::dispatch(Auth::user(), $selection, $zipName);

        return response()->json([
            'status' => 'processing',
            'zip_name' => $zipName
        ]);
    }

    public function bulkDownloadStatus($zipName)
    {
        $status = \Illuminate\Support\Facades\Cache::get("zip_status_{$zipName}", 'pending');

        return response()->json([
            'status' => $status,
            'url' => $status === 'completed' ? route('bulk.download-zip', $zipName) : null
        ]);
    }

    public function bulkMove(Request $request)
    {
        $request->validate([
            'selection' => 'required|array',
            'selection.*.type' => 'required|string|in:file,folder',
            'selection.*.id' => 'required|integer',
            'target_folder_id' => 'nullable|integer|exists:folders,id',
        ]);

        $targetFolderId = $request->target_folder_id ?: null;
        if ($targetFolderId) {
            $parent = Folder::findOrFail($targetFolderId);
            $this->authorize('view', $parent);
        }

        foreach ($request->selection as $item) {
            if ($item['type'] === 'file') {
                $file = File::findOrFail($item['id']);
                $this->authorize('update', $file);
                $file->update(['folder_id' => $targetFolderId]);
            } else {
                $folder = Folder::findOrFail($item['id']);
                $this->authorize('update', $folder);

                // Prevent moving to self
                if ($folder->id != $targetFolderId) {
                    $folder->update(['parent_id' => $targetFolderId]);
                }
            }
        }

        return back();
    }

    public function bulkDownloadZip($zipName)
    {
        $disk = config('filesystems.default');
        $path = 'temp_zips/' . $zipName . '.zip';

        if (!Storage::disk($disk)->exists($path)) {
            abort(404, 'Zip not found or expired.');
        }

        return Storage::disk($disk)->download($path, "downloadSelection.zip");
    }

    protected function getBreadcrumbs(?Folder $folder)
    {
        $breadcrumbs = [];

        while ($folder) {
            array_unshift($breadcrumbs, [
                'id' => $folder->id,
                'name' => $folder->name,
            ]);
            $folder = $folder->parent;
        }

        return $breadcrumbs;
    }
}
