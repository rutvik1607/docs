<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PdfUploadController;
use App\Http\Controllers\S3FileController;
use App\Http\Controllers\RecipientController;

Route::post('/upload-pdf', [PdfUploadController::class, 'store']);
Route::get('/s3-file/{path}', [S3FileController::class, 'getFileUrl'])->where('path', '.*');

Route::get('/test', [PdfUploadController::class, 'test']);

Route::post('add-recipient', [RecipientController::class, 'addRecipient']);
Route::post('recipients-list', [RecipientController::class, 'recipientList']);