<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Share;
use App\Models\File;
use App\Models\Folder;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Auth;

class ShareController extends Controller
{
    use AuthorizesRequests;

    public function store(Request $request)
    {
        $request->validate([
            'shareable_type' => 'required|in:App\Models\Folder,App\Models\File',
            'shareable_id' => 'required|integer',
            'permission' => 'required|in:view,download',
            'password' => 'nullable|string',
            'expires_at' => 'nullable|date|after:now',
            'max_downloads' => 'nullable|integer|min:1',
        ]);

        $model = $request->shareable_type === 'App\Models\Folder'
            ? Folder::findOrFail($request->shareable_id)
            : File::findOrFail($request->shareable_id);

        $this->authorize('view', $model);

        $share = Share::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => Auth::id(),
            'shareable_type' => $request->shareable_type,
            'shareable_id' => $request->shareable_id,
            'permission' => $request->permission,
            'password' => $request->password ? Hash::make($request->password) : null,
            'expires_at' => $request->expires_at,
            'max_downloads' => $request->max_downloads,
        ]);

        return response()->json(['url' => route('shares.show', $share->uuid)]);
    }

    public function show(Request $request, $uuid)
    {
        $share = Share::where('uuid', $uuid)->firstOrFail();

        // 1. Check expiration
        if ($share->expires_at && $share->expires_at->isPast()) {
            abort(410, 'This link has expired.');
        }

        // 2. Check download limit
        if ($share->max_downloads && $share->download_count >= $share->max_downloads) {
            abort(410, 'This link has reached its download limit.');
        }

        // 3. Check password
        if ($share->password && !$request->session()->get("share_auth_{$share->id}")) {
            return Inertia::render('SharePassword', ['uuid' => $uuid]);
        }

        $model = $share->shareable;

        if ($share->shareable_type === 'App\Models\File') {
            return Inertia::render('PublicShare', [
                'share' => $share,
                'file' => $model,
            ]);
        } else {
            // Folder: list files
            $folders = Folder::where('parent_id', $model->id)->get();
            $files = File::where('folder_id', $model->id)->get();

            return Inertia::render('PublicShare', [
                'share' => $share,
                'folder' => $model,
                'folders' => $folders,
                'files' => $files,
            ]);
        }
    }

    public function authenticate(Request $request, $uuid)
    {
        $share = Share::where('uuid', $uuid)->firstOrFail();

        $request->validate(['password' => 'required|string']);

        if (Hash::check($request->password, $share->password)) {
            $request->session()->put("share_auth_{$share->id}", true);
            return redirect()->route('shares.show', $uuid);
        }

        return back()->withErrors(['password' => 'Incorrect password.']);
    }

    public function download(Request $request, $uuid, File $file = null)
    {
        $share = Share::where('uuid', $uuid)->firstOrFail();

        // Standard validations
        if ($share->expires_at && $share->expires_at->isPast()) abort(410);
        if ($share->max_downloads && $share->download_count >= $share->max_downloads) abort(410);
        if ($share->password && !$request->session()->get("share_auth_{$share->id}")) abort(403);

        // Check permission
        if ($share->permission !== 'download') abort(403);

        if ($share->shareable_type === 'App\Models\File') {
            $file = $share->shareable;
            $share->increment('download_count');
            return Storage::disk($file->disk)->download($file->path, $file->original_name);
        } else {
            // Folder share logic
            if ($file) {
                // Single file from shared folder
                $share->increment('download_count');
                return Storage::disk($file->disk)->download($file->path, $file->original_name);
            } else {
                // Full folder ZIP
                // Phase 5: Implement ZIP queue
                abort(501, 'Folder download via ZIP is being processed in a queue.');
            }
        }
    }
}
