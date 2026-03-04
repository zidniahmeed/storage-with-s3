<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Share extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'user_id',
        'shareable_type',
        'shareable_id',
        'permission',
        'password',
        'expires_at',
        'max_downloads',
        'download_count',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function shareable(): MorphTo
    {
        return $this->morphTo();
    }
}
