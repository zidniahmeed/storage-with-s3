<?php

namespace App\Console\Commands;

use App\Models\File;
use App\Models\Folder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PurgeTrashCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'drive:purge-trash';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Permanently delete items in trash for more than 30 days';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $cutoff = now()->subDays(30);

        $this->info("Purging items trashed before {$cutoff}");

        // Files
        File::onlyTrashed()
            ->where('deleted_at', '<=', $cutoff)
            ->chunk(100, function ($files) {
                foreach ($files as $file) {
                    $this->info("Permanently deleting file: {$file->original_name}");
                    Storage::disk($file->disk)->delete($file->path);
                    $file->forceDelete();
                }
            });

        // Folders
        Folder::onlyTrashed()
            ->where('deleted_at', '<=', $cutoff)
            ->chunk(100, function ($folders) {
                foreach ($folders as $folder) {
                    $this->info("Permanently deleting folder: {$folder->name}");
                    $folder->forceDelete();
                }
            });

        $this->info('Purge complete.');
    }
}
