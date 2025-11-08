<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PdfUploadController;
use App\Http\Controllers\S3FileController;

Route::post('/upload-pdf', [PdfUploadController::class, 'store']);
Route::get('/s3-file/{path}', [S3FileController::class, 'getFileUrl'])->where('path', '.*');
