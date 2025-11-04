<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PdfUploadController;

Route::post('/upload-pdf', [PdfUploadController::class, 'store']);
