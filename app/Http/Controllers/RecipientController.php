<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Mail;
use App\Mail\ShareRecipientMail;
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
                'template_id' => 'required|integer',
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
            $templateId = $request->template_id;
            $now = now();

            $data['created_at'] = $now;
            $data['updated_at'] = $now;
            $data['created_by'] = 1;
            
            $recipientId = DB::table('recipients')->insertGetId($data);

            // Fetch the inserted data
            $recipient = DB::table('recipients')->where('id', $recipientId)->first();

            // Add record to share_recipients table
            DB::table('share_recipients')->insert([
                'template_id' => $templateId,
                'user_id' => 1,
                'recipient_id' => $recipientId,
                'date' => $now,
                'created_at' => $now,
                'updated_at' => $now
            ]);

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

    public function searchRecipient(Request $request)
    {
        try {

            // ------------------------------
            // VALIDATION
            // ------------------------------
            $validator = Validator::make($request->all(), [
                'keyword' => 'required',
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
            
            $search = $request->keyword;

            $recipients = \DB::table('recipients')
                ->where('created_by', $user)
                ->where('status', '!=', 2)
                ->select('id','first_name', 'last_name', 'email')
                ->where(function($query) use ($search) {
                    $query->where('first_name', 'LIKE', "%{$search}%")
                          ->orWhere('last_name', 'LIKE', "%{$search}%")
                          ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"])
                          ->orWhere('email', 'LIKE', "%{$search}%");
                })
                ->limit(10)
                ->get();

            // ---------------------------------
            // SUCCESS RESPONSE
            // ---------------------------------
            return response()->json([
                'status'       => true,
                'success_code' => 2000,
                'message'      => 'Recipient search result',
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

    public function shareRecipient(Request $request)
    {
        try {

            // ------------------------------
            // VALIDATION
            // ------------------------------
            $validator = Validator::make($request->all(), [
                'recipient_ids'   => 'required|array|min:1',
                'recipient_ids.*' => 'required|integer|exists:recipients,id',
                'template_id' => 'required',
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

            $recipientIds = $request->recipient_ids;
            $userId       = $request->user_id;
            $templateId   = $request->template_id;
            $user   = [];
            $insertData = [];
            $now = now();

            // ----------------------------------
            // CHECK — recipients belong to user
            // ----------------------------------
            $recipients = DB::table('recipients')
                ->whereIn('id', $recipientIds)
                ->where('created_by', $userId)
                ->where('status', 1)
                ->select('id', 'email', 'first_name')
                ->get();

            if (count($recipients) != count($recipientIds)) {
                return response()->json([
                    'status'     => false,
                    'error_code' => 403,
                    'message'    => 'One or more recipients do not belong to this user'
                ], 403);
            }

            foreach ($recipients as $rec) {

                $payload = [
                    'recipient_id' => $rec->id,
                    'email'        => $rec->email,
                    'template_id'  => $templateId,
                    'timestamp'    => time()
                ];

                $encryptedString = encrypt(json_encode($payload));

                $secureLink = route('shared.document.link', $encryptedString);
                
                $insertData[] = [
                    'template_id' => $templateId,
                    'user_id'  => $userId,
                    'recipient_id' => $rec->id,
                    // 'link'   => $secureLink,
                    'date'  => $now,
                    'created_at'  => $now,
                    'updated_at'  => $now
                ];

                Mail::to($rec->email)->send(new ShareRecipientMail($user, $rec, $secureLink));
            }

            DB::table('share_recipients')->insert($insertData);

            // ---------------------------
            // SUCCESS RESPONSE
            // ---------------------------
            return response()->json([
                'status'       => true,
                'success_code' => 2000,
                'message'      => 'Recipients assigned successfully',
                'data'         => $insertData
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

    public function getRecipientsByTemplate(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'template_id' => 'required|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status'      => false,
                    'error_code'  => 422,
                    'message'     => 'Validation failed',
                    'errors'      => $validator->errors(),
                ], 422);
            }

            $templateId = $request->template_id;
            
            $recipients = DB::table('share_recipients')
                ->join('recipients', 'share_recipients.recipient_id', '=', 'recipients.id')
                ->where('share_recipients.template_id', $templateId)
                ->select('recipients.*', 'share_recipients.date')
                ->orderBy('share_recipients.id', 'DESC')
                ->get();

            return response()->json([
                'status'       => true,
                'success_code' => 2000,
                'message'      => 'Recipients fetched successfully',
                'data'         => $recipients
            ], 200);

        } catch (Exception $e) {

            return response()->json([
                'status'      => false,
                'error_code'  => 5000,
                'message'     => 'Something went wrong',
                'error'       => $e->getMessage(),
            ], 500);
        }
    }

    public function openDocument($encrypted)
    {
        try {
            $payload = json_decode(decrypt($encrypted), true);

            // Check data integrity
            if (!$payload || !isset($payload['recipient_id']) || !isset($payload['email'])) {
                return "Invalid or expired link";
            }

            // Validate recipient still exists
            $recipient = DB::table('recipients')
                ->where('id', $payload['recipient_id'])
                ->where('email', $payload['email'])
                ->first();

            if (!$recipient) {
                return "Invalid user";
            }

            $template = [];
            // Fetch template data
            // $template = DB::table('templates')->where('id', $payload['template_id'])->first();

            // if (!$template) {
            //     return "Template not found";
            // }

            return view('open-document', [
                'recipient' => $recipient,
                'template'  => $template
            ]);

        } catch (\Throwable $e) {
            return "Link Invalid or Tampered";
        }
    }

    public function updateTemplate(Request $request)
    {
        try {

            // -------------------------------
            // VALIDATION
            // -------------------------------
            $validator = Validator::make($request->all(), [
                'text' => 'required|array',
                'text.value' => 'required',
                'text.token' => 'required',
            ], [
                'text.required' => 'Text object is required.',
                'text.value.required' => 'Text value is required.',
                'text.token.required' => 'Token is required.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'code'   => 422,
                    'message' => 'Validation Error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $shareRecipients = DB::table('share_recipients')
                ->where('token', $request->text['token'])
                ->first();

            if (!$shareRecipients) {
                return response()->json([
                    'status' => false,
                    'code'   => 404,
                    'message' => 'Recipients not found',
                ], 404);
            }

            // DB::table('share_recipients')
            //     ->where('template_id', $request->template_id)
            //     ->where('user_id', $request->user_id)
            //     ->where('recipient_id', $request->recipient_id)
            //     ->update([
            //         'field_json' => $request->text['value'],
            //         'updated_at' => now(),
            //     ]);

            // --------------------------------------------
            // SUCCESS RESPONSE
            // --------------------------------------------
            return response()->json([
                'status'  => true,
                'code'    => 200,
                'message' => 'Template updated successfully',
                'data' => []
            ], 200);

        } catch (\Throwable $e) {

            return response()->json([
                'status' => false,
                'code'   => 500,
                'message' => 'Something went wrong',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function deleteRecipient(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'template_id' => 'required|integer',
                'user_id' => 'required|integer',
                'recipient_id' => 'required|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status'      => false,
                    'error_code'  => 422,
                    'message'     => 'Validation failed',
                    'errors'      => $validator->errors(),
                ], 422);
            }

            $shareRecipient = DB::table('share_recipients')
                ->where('template_id', $request->template_id)
                ->where('user_id', $request->user_id)
                ->where('recipient_id', $request->recipient_id)
                ->first();

            if (!$shareRecipient) {
                return response()->json([
                    'status'      => false,
                    'error_code'  => 404,
                    'message'     => 'Share recipient not found',
                ], 404);
            }

            DB::table('share_recipients')
                ->where('template_id', $request->template_id)
                ->where('user_id', $request->user_id)
                ->where('recipient_id', $request->recipient_id)
                ->delete();

            return response()->json([
                'status'       => true,
                'success_code' => 2000,
                'message'      => 'Recipient deleted successfully',
                'data'         => []
            ], 200);

        } catch (Exception $e) {

            return response()->json([
                'status'      => false,
                'error_code'  => 5000,
                'message'     => 'Something went wrong',
                'error'       => $e->getMessage(),
            ], 500);
        }
    }
}
