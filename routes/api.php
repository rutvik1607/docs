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
Route::post('recipients-by-template', [RecipientController::class, 'getRecipientsByTemplate']);
Route::post('search-recipient', [RecipientController::class, 'searchRecipient']);
Route::post('share-recipient', [RecipientController::class, 'shareRecipient']);
Route::post('send-share-email', [RecipientController::class, 'sendShareEmail']);
Route::post('update-template', [RecipientController::class, 'updateTemplate']);
Route::post('delete-recipient', [RecipientController::class, 'deleteRecipient']);
Route::post('save-field-assignments', [RecipientController::class, 'saveFieldAssignments']);
Route::post('save-recipient-field-values', [RecipientController::class, 'saveRecipientFieldValues']);
Route::post('get-template-data', [RecipientController::class, 'getTemplateData']);

use App\Http\Controllers\EmailTemplateController;
Route::apiResource('email-templates', EmailTemplateController::class);