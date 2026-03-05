<?php

namespace App\Http\Controllers;

use App\Models\File;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StorageController extends Controller
{
    /**
     * Get storage summary for the authenticated user.
     * Returns total size, file count, breakdown by category, and largest files.
     */
    public function summary(Request $request)
    {
        $userId = Auth::id();

        // Total size and count
        $totals = File::where('user_id', $userId)
            ->selectRaw('COALESCE(SUM(size), 0) as total_size, COUNT(*) as total_files')
            ->first();

        // Breakdown by mime type category
        $categories = File::where('user_id', $userId)
            ->select(DB::raw("
                CASE
                    WHEN mime_type LIKE 'image/%' THEN 'Images'
                    WHEN mime_type LIKE 'video/%' THEN 'Videos'
                    WHEN mime_type LIKE 'audio/%' THEN 'Audio'
                    WHEN mime_type LIKE 'application/pdf' THEN 'Documents'
                    WHEN mime_type LIKE 'application/msword' OR mime_type LIKE 'application/vnd.openxmlformats%' OR mime_type LIKE 'application/vnd.ms-%' OR mime_type LIKE 'text/%' THEN 'Documents'
                    WHEN mime_type LIKE 'application/zip' OR mime_type LIKE 'application/x-rar%' OR mime_type LIKE 'application/x-7z%' OR mime_type LIKE 'application/gzip' OR mime_type LIKE 'application/x-tar' THEN 'Archives'
                    ELSE 'Other'
                END as category
            "), DB::raw('COALESCE(SUM(size), 0) as total_size'), DB::raw('COUNT(*) as file_count'))
            ->groupBy('category')
            ->orderByDesc('total_size')
            ->get();

        // Top 10 largest files
        $largestFiles = File::where('user_id', $userId)
            ->orderByDesc('size')
            ->limit(10)
            ->select('id', 'original_name', 'mime_type', 'size', 'folder_id', 'created_at')
            ->with('folder:id,name')
            ->get();

        return response()->json([
            'total_size' => (int) $totals->total_size,
            'total_files' => (int) $totals->total_files,
            'categories' => $categories,
            'largest_files' => $largestFiles,
        ]);
    }
}
