<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RecipientController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('document/{link}', [RecipientController::class, 'openDocument'])->name('shared.document.link');