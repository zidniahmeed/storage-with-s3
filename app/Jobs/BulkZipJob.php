<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\File;
use App\Models\Folder;
use Illuminate\Support\Facades\Storage;
use ZipArchive;
use Illuminate\Support\Facades\Cache;

class BulkZipJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $user;
    public $selection;
    public $zipName;

    /**
     * Create a new job instance.
     */
    public function __construct($user, $selection, $zipName)
    {
        $this->user = $user;
        $this->selection = $selection;
        $this->zipName = $zipName;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Cache::put("zip_status_{$this->zipName}", 'processing', 3600);

        $tempZip = storage_path('app/temp/' . $this->zipName . '.zip');
        if (!is_dir(dirname($tempZip))) {
            mkdir(dirname($tempZip), 0755, true);
        }

        $zip = new ZipArchive();
        if ($zip->open($tempZip, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            Cache::put("zip_status_{$this->zipName}", 'error', 3600);
            return;
        }

        foreach ($this->selection as $item) {
            if ($item['type'] === 'file') {
                $file = File::find($item['id']);
                if ($file) {
                    $this->addFileToZip($zip, $file, '');
                }
            } else {
                $folder = Folder::find($item['id']);
                if ($folder) {
                    $this->addFolderToZip($zip, $folder, $folder->name . '/');
                }
            }
        }

        $zip->close();

        // Move to storage
        $disk = config('filesystems.default');
        $finalPath = 'temp_zips/' . $this->zipName . '.zip';
        Storage::disk($disk)->put($finalPath, fopen($tempZip, 'r+'));
        unlink($tempZip);

        Cache::put("zip_status_{$this->zipName}", 'completed', 3600);
    }

    protected function addFileToZip($zip, $file, $zipPath)
    {
        $disk = Storage::disk($file->disk);
        if ($disk->exists($file->path)) {
            $zip->addFromString($zipPath . $file->original_name, $disk->get($file->path));
        }
    }

    protected function addFolderToZip($zip, $folder, $zipPath)
    {
        $zip->addEmptyDir($zipPath);

        foreach ($folder->files as $file) {
            $this->addFileToZip($zip, $file, $zipPath);
        }

        foreach ($folder->children as $subFolder) {
            $this->addFolderToZip($zip, $subFolder, $zipPath . $subFolder->name . '/');
        }
    }
}
