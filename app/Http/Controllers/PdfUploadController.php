<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PdfUploadController extends Controller
{

    public function store(Request $request)
    {
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('pdfs', 'public');
            return response()->json(['path' => $path], 200);
        }

        return response()->json(['error' => 'No file uploaded'], 400);
    }

    public function test()
    {
        return response()->json(['message' => 'Test endpoint reached', 'path' => "/storage/upload/testing.pdf"], 200);
    }
}
