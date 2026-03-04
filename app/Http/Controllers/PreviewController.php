<?php

namespace App\Http\Controllers;

use App\Models\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class PreviewController extends Controller
{
    use AuthorizesRequests;

    public function show(File $file)
    {
        $this->authorize('view', $file);

        $disk = Storage::disk($file->disk);

        if (!$disk->exists($file->path)) {
            abort(404);
        }

        $mimeType = $file->mime_type;

        if (
            str_starts_with($mimeType, 'image/') ||
            $mimeType === 'application/pdf' ||
            str_starts_with($mimeType, 'video/') ||
            str_starts_with($mimeType, 'text/') ||
            $mimeType === 'application/json' ||
            $mimeType === 'application/javascript'
        ) {

            return $disk->response($file->path);
        }

        abort(415, 'File type not supported for preview.');
    }
}
