<?php

namespace App\Http\Controllers;

use App\Models\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class FileController extends Controller
{
    use AuthorizesRequests;

    public function destroy(File $file)
    {
        $this->authorize('delete', $file);

        $file->delete(); // Soft delete

        return back();
    }

    public function download(File $file)
    {
        $this->authorize('view', $file);

        return Storage::disk($file->disk)->download($file->path, $file->original_name);
    }
}
