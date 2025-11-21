<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use Exception;
use DB;

class RecipientController extends Controller
{
    public function addRecipient(Request $request)
    {
        $user = 1;
        
        try {

            // ------------------------------
            // VALIDATION
            // ------------------------------
            $validator = Validator::make($request->all(), [
                'first_name' => 'required',
                'last_name' => 'required',
                'email' => [
                            'required',
                            'email',
                                Rule::unique('recipients')
                                    ->where(fn($query) => $query->where('status', 1)
                                    ->where('created_by', $user)),
                ],
                'phone' => ['nullable', 'regex:/^[0-9\-\+\(\)\s]{7,20}$/'],
                'postal_code' => ['nullable', 'regex:/^[A-Za-z0-9\- ]{3,10}$/'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status'      => false,
                    'error_code'  => 422,   // Validation error code
                    'message'     => 'Validation failed',
                    'errors'      => $validator->errors(),
                ], 422);
            }


            // ------------------------------
            // MAIN LOGIC
            // ------------------------------
            $data = $request->all();

            $data['created_at'] = now();
            $data['updated_at'] = now();
            $data['created_by'] = 1;
            
            $recipientId = DB::table('recipients')->insertGetId($data);

            // Fetch the inserted data
            $recipient = DB::table('recipients')->where('id', $recipientId)->first();

            // ------------------------------
            // SUCCESS RESPONSE
            // ------------------------------
            return response()->json([
                'status'      => true,
                'success_code'=> 2000,
                'message'     => 'Recipient created successfully',
                'data'        => $recipient
            ], 201);

        } catch (Exception $e) {

            // ------------------------------
            // FAILED RESPONSE
            // ------------------------------
            return response()->json([
                'status'      => false,
                'error_code'  => 5000, // Internal error code
                'message'     => 'Something went wrong',
                'error'       => $e->getMessage(),
            ], 500);
        }
    }

    public function recipientList(Request $request)
    {
        try {

            // ------------------------------
            // VALIDATION
            // ------------------------------
            $validator = Validator::make($request->all(), [
                'user_id' => 'required',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status'      => false,
                    'error_code'  => 422,   // Validation error code
                    'message'     => 'Validation failed',
                    'errors'      => $validator->errors(),
                ], 422);
            }

            $user = $request->user_id; // logged-in user / org user id
            
            // ---------------------------------
            // GET LIST FILTERED BY created_by
            // ---------------------------------
            $recipients = DB::table('recipients')
                ->where('status', 1)
                ->where('created_by', $user)
                ->orderBy('id', 'DESC')
                ->get();

            // ---------------------------------
            // SUCCESS RESPONSE
            // ---------------------------------
            return response()->json([
                'status'       => true,
                'success_code' => 2000,
                'message'      => 'Recipient list fetched successfully',
                'data'         => $recipients
            ], 200);

        } catch (Exception $e) {

            // ---------------------------------
            // FAILED RESPONSE
            // ---------------------------------
            return response()->json([
                'status'      => false,
                'error_code'  => 5000,
                'message'     => 'Something went wrong',
                'error'       => $e->getMessage(),
            ], 500);
        }
    }
}
