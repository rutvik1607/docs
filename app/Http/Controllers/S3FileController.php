<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class S3FileController extends Controller
{
    //

    public function getFileUrl($path)
    {
        try {
            $disk = Storage::disk('s3');

            if (!$disk->exists($path)) {
                return response()->json(['error' => 'File not found'], 404);
            }

            $url = $disk->url($path);

            return response()->json(['disk' => $disk, 'url' => $url]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'S3 error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
