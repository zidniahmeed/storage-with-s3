<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class UploadController extends Controller
{
    public function init(Request $request)
    {
        $request->validate([
            'filename' => 'required|string',
            'mime_type' => 'required|string',
            'folder_id' => 'nullable|exists:folders,id',
            'relative_path' => 'nullable|string',
        ]);

        $disk = config('filesystems.default');
        $s3 = Storage::disk($disk)->getClient();
        $bucket = config("filesystems.disks.{$disk}.bucket");
        $key = 'uploads/' . Auth::id() . '/' . Str::uuid() . '_' . $request->filename;

        $result = $s3->createMultipartUpload([
            'Bucket' => $bucket,
            'Key'    => $key,
            'ContentType' => $request->mime_type,
        ]);

        return response()->json([
            'upload_id' => $result['UploadId'],
            'key' => $key,
            'disk' => $disk,
        ]);
    }

    public function signPart(Request $request)
    {
        $request->validate([
            'upload_id' => 'required|string',
            'key' => 'required|string',
            'part_number' => 'required|integer',
            'disk' => 'required|string',
        ]);

        $s3 = Storage::disk($request->disk)->getClient();
        $bucket = config("filesystems.disks.{$request->disk}.bucket");

        $command = $s3->getCommand('UploadPart', [
            'Bucket'     => $bucket,
            'Key'        => $request->key,
            'UploadId'   => $request->upload_id,
            'PartNumber' => $request->part_number,
        ]);

        $request_signed = $s3->createPresignedRequest($command, '+1 hour');

        return response()->json([
            'url' => (string) $request_signed->getUri(),
        ]);
    }

    public function complete(Request $request)
    {
        $request->validate([
            'upload_id' => 'required|string',
            'key' => 'required|string',
            'parts' => 'required|array',
            'parts.*.PartNumber' => 'required|integer',
            'parts.*.ETag' => 'required|string',
            'disk' => 'required|string',
            'folder_id' => 'nullable|exists:folders,id',
            'filename' => 'required|string',
            'mime_type' => 'required|string',
            'size' => 'required|integer',
            'relative_path' => 'nullable|string',
        ]);

        $s3 = Storage::disk($request->disk)->getClient();
        $bucket = config("filesystems.disks.{$request->disk}.bucket");

        $s3->completeMultipartUpload([
            'Bucket'   => $bucket,
            'Key'      => $request->key,
            'UploadId' => $request->upload_id,
            'MultipartUpload' => [
                'Parts' => $request->parts,
            ],
        ]);

        $targetFolderId = $this->getTargetFolderId($request->folder_id, $request->relative_path);

        $file = Auth::user()->files()->create([
            'folder_id' => $targetFolderId,
            'name' => basename($request->key),
            'original_name' => $request->filename,
            'mime_type' => $request->mime_type,
            'size' => $request->size,
            'disk' => $request->disk,
            'path' => $request->key,
        ]);

        return response()->json($file);
    }

    protected function getTargetFolderId($parent_id, $relative_path)
    {
        if (!$relative_path || !str_contains($relative_path, '/')) {
            return $parent_id;
        }

        $parts = explode('/', $relative_path);
        array_pop($parts); // remove filename

        $currentId = $parent_id;

        foreach ($parts as $folderName) {
            $folder = \App\Models\Folder::firstOrCreate([
                'user_id' => Auth::id(),
                'parent_id' => $currentId,
                'name' => $folderName,
            ]);
            $currentId = $folder->id;
        }

        return $currentId;
    }
}
