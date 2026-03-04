<?php

namespace App\Jobs;

use App\Models\File;
use App\Models\Folder;
use Illuminate\Bus\Dispatchable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class ZipFolderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(public Folder $folder) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $this->folder->update(['zip_status' => 'processing']);

        $tempFile = tempnam(sys_get_temp_dir(), 'zip');
        $zip = new ZipArchive();

        if ($zip->open($tempFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            $this->addFolderToZip($this->folder, $zip);
            $zip->close();

            $disk = config('filesystems.default');
            $path = "zips/{$this->folder->id}_" . now()->timestamp . ".zip";

            Storage::disk($disk)->put($path, fopen($tempFile, 'r+'));

            $this->folder->update([
                'zip_status' => 'completed',
                'zip_path' => $path,
            ]);

            unlink($tempFile);
        } else {
            $this->folder->update(['zip_status' => 'failed']);
        }
    }

    protected function addFolderToZip(Folder $folder, ZipArchive $zip, $zipPath = '')
    {
        $currentZipPath = $zipPath . ($zipPath ? '/' : '') . $folder->name;
        $zip->addEmptyDir($currentZipPath);

        // Add files
        foreach ($folder->files as $file) {
            $content = Storage::disk($file->disk)->get($file->path);
            $zip->addFromString($currentZipPath . '/' . $file->original_name, $content);
        }

        // Add subfolders
        foreach ($folder->children as $child) {
            $this->addFolderToZip($child, $zip, $currentZipPath);
        }
    }

    public function failed(\Throwable $exception)
    {
        $this->folder->update(['zip_status' => 'failed']);
    }
}
