<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\EmailTemplate;
use Illuminate\Support\Facades\Validator;

class EmailTemplateController extends Controller
{
    public function index()
    {
        $templates = EmailTemplate::orderBy('created_at', 'desc')->get();
        return response()->json([
            'status' => true,
            'data' => $templates
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $template = EmailTemplate::create($request->all());

        return response()->json([
            'status' => true,
            'message' => 'Template created successfully',
            'data' => $template
        ], 201);
    }

    public function show($id)
    {
        $template = EmailTemplate::find($id);

        if (!$template) {
            return response()->json([
                'status' => false,
                'message' => 'Template not found'
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data' => $template
        ]);
    }

    public function update(Request $request, $id)
    {
        $template = EmailTemplate::find($id);

        if (!$template) {
            return response()->json([
                'status' => false,
                'message' => 'Template not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'subject' => 'sometimes|required|string|max:255',
            'body' => 'sometimes|required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $template->update($request->all());

        return response()->json([
            'status' => true,
            'message' => 'Template updated successfully',
            'data' => $template
        ]);
    }

    public function destroy($id)
    {
        $template = EmailTemplate::find($id);

        if (!$template) {
            return response()->json([
                'status' => false,
                'message' => 'Template not found'
            ], 404);
        }

        $template->delete();

        return response()->json([
            'status' => true,
            'message' => 'Template deleted successfully'
        ]);
    }
}
