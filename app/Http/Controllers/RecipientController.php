<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Mail;
use App\Mail\ShareRecipientMail;
use App\Mail\DocumentComplateMail;
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

            info($validator->errors());
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
            info($e->getMessage());
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
            $insertData = [];
            $now = now();

            // ----------------------------------
            // CHECK — recipients belong to user
            // ----------------------------------
            $recipients = DB::table('recipients')
                ->whereIn('id', $recipientIds)
                ->where('created_by', $userId)
                ->where('status', 1)
                ->select('id', 'email', 'first_name', 'last_name')
                ->get();

            if (count($recipients) != count($recipientIds)) {
                return response()->json([
                    'status'     => false,
                    'error_code' => 403,
                    'message'    => 'One or more recipients do not belong to this user'
                ], 403);
            }

            foreach ($recipients as $rec) {

                // Generate unique UUID token for each recipient
                $token = Str::uuid()->toString();

                // Create link using UUID token
                $secureLink = route('shared.document.link', $token);
                
                $insertData[] = [
                    'template_id' => $templateId,
                    'user_id'  => $userId,
                    'recipient_id' => $rec->id,
                    'token' => $token,
                    'date'  => $now,
                    'created_at'  => $now,
                    'updated_at'  => $now
                ];


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
                ->select(
                    'recipients.id as recipient_id',
                    'recipients.first_name',
                    'recipients.last_name',
                    'recipients.email',
                    'recipients.phone',
                    'recipients.postal_code',
                    'recipients.status as recipient_status',
                    'recipients.created_at as recipient_created_at',
                    'recipients.updated_at as recipient_updated_at',
                    'share_recipients.id as share_recipient_id',
                    'share_recipients.template_id',
                    'share_recipients.user_id',
                    'share_recipients.token',
                    'share_recipients.field_json',
                    'share_recipients.date',
                    'share_recipients.created_at as share_created_at',
                    'share_recipients.updated_at as share_updated_at'
                )
                ->orderBy('share_recipients.id', 'DESC')
                ->get()
                ->map(function ($item) {
                    $fields = [];
                    if (!empty($item->field_json)) {
                        $decoded = json_decode($item->field_json, true);
                        if (is_array($decoded)) {
                            $fields = $decoded;
                        }
                    }

                    $submittedFields = array_values(array_filter($fields, function ($field) {
                        if (!is_array($field)) {
                            return false;
                        }
                        if (array_key_exists('isSubmitted', $field)) {
                            return (bool) $field['isSubmitted'];
                        }
                        if (!empty($field['content'])) {
                            return true;
                        }
                        if (!empty($field['imageData'])) {
                            return true;
                        }
                        return false;
                    }));

                    return [
                        'id' => $item->recipient_id,
                        'first_name' => $item->first_name,
                        'last_name' => $item->last_name,
                        'email' => $item->email,
                        'phone' => $item->phone,
                        'postal_code' => $item->postal_code,
                        'status' => $item->recipient_status,
                        'created_at' => $item->recipient_created_at,
                        'updated_at' => $item->recipient_updated_at,
                        'template_id' => $item->template_id,
                        'share_recipient_id' => $item->share_recipient_id,
                        'token' => $item->token,
                        'link' => $item->token ? route('shared.document.link', $item->token) : null,
                        'assigned_at' => $item->share_created_at,
                        'last_activity_at' => $item->share_updated_at,
                        'date' => $item->date,
                        'fields' => $fields,
                        'submitted_fields' => $submittedFields,
                        'submitted_field_count' => count($submittedFields),
                        'total_fields' => count($fields),
                        'is_fully_submitted' => count($fields) > 0 && count($fields) === count($submittedFields),
                    ];
                })
                ->values();

            $allRecipientsSubmitted = $recipients->every(function ($recipient) {
                return $recipient['is_fully_submitted'];
            });

            return response()->json([
                'status'       => true,
                'success_code' => 2000,
                'message'      => 'Recipients fetched successfully',
                'data'         => $recipients,
                'all_recipients_submitted' => $allRecipientsSubmitted
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

    public function openDocument($token)
    {
        try {
            // Find share_recipient record by token
            $shareRecipient = DB::table('share_recipients')
                ->where('token', $token)
                ->first();

            if (!$shareRecipient) {
                return "Invalid or expired link";
            }

            DB::table('share_recipients')->where('id', $shareRecipient->id)->update(['status' => 1, 'view_date_time' => now()]);
            
            // Validate recipient still exists
            $recipient = DB::table('recipients')
                ->where('id', $shareRecipient->recipient_id)
                ->where('status', 1)
                ->first();

            if (!$recipient) {
                return "Invalid user";
            }

            $templateId = $shareRecipient->template_id;

            $shareAssignments = DB::table('share_recipients')
                ->join('recipients', 'share_recipients.recipient_id', '=', 'recipients.id')
                ->where('share_recipients.template_id', $templateId)
                ->select(
                    'share_recipients.recipient_id',
                    'share_recipients.field_json',
                    'recipients.first_name',
                    'recipients.last_name',
                    'recipients.email'
                )
                ->get();

            $assignedFields = [];
            foreach ($shareAssignments as $assignment) {
                if (empty($assignment->field_json)) {
                    continue;
                }

                $fields = json_decode($assignment->field_json, true);
                if (!is_array($fields)) {
                    continue;
                }

                foreach ($fields as $field) {
                    if (!is_array($field)) {
                        continue;
                    }

                    $isSubmitted = isset($field['isSubmitted'])
                        ? (bool) $field['isSubmitted']
                        : (!empty($field['content']) || !empty($field['imageData']));

                    if ($assignment->recipient_id !== $shareRecipient->recipient_id && !$isSubmitted) {
                        continue;
                    }

                    $field['recipientId'] = $assignment->recipient_id;
                    $field['recipientName'] = trim(($assignment->first_name ?? '') . ' ' . ($assignment->last_name ?? ''));
                    $field['recipientEmail'] = $assignment->email ?? '';
                    $field['isSubmitted'] = $isSubmitted;

                    $assignedFields[] = $field;
                }
            }

            $template = [];
            // Fetch template data if needed
            // $template = DB::table('templates')->where('id', $shareRecipient->template_id)->first();

            $allRecipientsSubmitted = true;
            foreach ($shareAssignments as $assignment) {
                if (empty($assignment->field_json)) {
                    // If a recipient has no fields assigned, are they "submitted"?
                    // Assuming yes, or maybe we should skip them.
                    // But if they have fields and field_json is empty, that's weird.
                    // Let's assume if they have fields assigned, they must be submitted.
                    // But here we are iterating over assignments.
                    continue;
                }

                $fields = json_decode($assignment->field_json, true);
                if (!is_array($fields)) {
                    continue;
                }
                
                // Check if this recipient has any fields
                if (count($fields) > 0) {
                     $submittedCount = 0;
                     foreach ($fields as $field) {
                        $isSubmitted = isset($field['isSubmitted']) && $field['isSubmitted'];
                        $hasContent = !empty($field['content']);
                        $hasImage = !empty($field['imageData']);
                        
                        if ($isSubmitted || $hasContent || $hasImage) {
                            $submittedCount++;
                        }
                     }
                     
                     if ($submittedCount < count($fields)) {
                         $allRecipientsSubmitted = false;
                         break;
                     }
                }
            }

            return view('open-document', [
                'recipient' => $recipient,
                'template'  => $template,
                'token' => $token,
                'assignedFields' => $assignedFields,
                'allRecipientsSubmitted' => $allRecipientsSubmitted
            ]);

        } catch (\Throwable $e) {
            return "Link Invalid or Tampered";
        }
    }

    public function saveRecipientFieldValues(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'token' => 'required|string',
                'fields' => 'required|array',
                'fields.*.id' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status'      => false,
                    'error_code'  => 422,
                    'message'     => 'Validation failed',
                    'errors'      => $validator->errors(),
                ], 422);
            }

            $token = $request->token;
            $fields = $request->fields;

            // Find share_recipient record by token
            $shareRecipient = DB::table('share_recipients')
                ->where('token', $token)
                ->first();

            if (!$shareRecipient) {
                return response()->json([
                    'status'     => false,
                    'error_code' => 404,
                    'message'    => 'Invalid token or link expired'
                ], 404);
            }

            // Get existing field_json
            $existingFields = [];
            if (!empty($shareRecipient->field_json)) {
                $existingFields = json_decode($shareRecipient->field_json, true);
                if (!is_array($existingFields)) {
                    $existingFields = [];
                }
            }

            // Update field values with recipient-entered content and imageData
            $updatedFields = [];
            foreach ($existingFields as $existingField) {
                $fieldId = $existingField['id'] ?? null;
                // Find matching field from request
                $matchingField = null;
                foreach ($fields as $field) {
                    if (isset($field['id']) && $field['id'] === $fieldId) {
                        $matchingField = $field;
                        break;
                    }
                }
                
                if ($matchingField) {
                    // Update content with recipient's entered value
                    if (isset($matchingField['content'])) {
                        $existingField['content'] = $matchingField['content'];
                    }
                    
                    // Update imageData for signature/stamp fields
                    if (isset($matchingField['imageData'])) {
                        $existingField['imageData'] = $matchingField['imageData'];
                    }
                    
                    // Update isSubmitted status
                    if (isset($matchingField['isSubmitted'])) {
                        $existingField['isSubmitted'] = $matchingField['isSubmitted'];
                    }

                    // Update IP Address and Location
                    if (isset($matchingField['ipAddress'])) {
                        $existingField['ipAddress'] = $matchingField['ipAddress'];

                        $ipAddress = $matchingField['ipAddress'];
                    }
                    if (isset($matchingField['location'])) {
                        $existingField['location'] = $matchingField['location'];
                        $location = $matchingField['location'];
                    }
                }
                $updatedFields[] = $existingField;
            }

            // Update field_json with new values
            DB::table('share_recipients')
                ->where('token', $token)
                ->update([
                    'status' => 2,
                    'completed_date_time' => now(),
                    'ip_address' => $ipAddress,
                    'location' => $location,
                    'field_json' => json_encode($updatedFields),
                    'updated_at' => now(),
                ]);

            // Check if all recipients have submitted
            $templateId = $shareRecipient->template_id;
            $shareAssignments = DB::table('share_recipients')
                ->where('template_id', $templateId)
                ->get();

            $allRecipientsSubmitted = true;
            foreach ($shareAssignments as $assignment) {
                if (empty($assignment->field_json)) {
                    continue;
                }
                $fields = json_decode($assignment->field_json, true);
                if (!is_array($fields) || count($fields) === 0) {
                    continue;
                }
                
                $submittedCount = 0;
                foreach ($fields as $field) {
                    $isSubmitted = isset($field['isSubmitted']) && $field['isSubmitted'];
                    $hasContent = !empty($field['content']);
                    $hasImage = !empty($field['imageData']);
                    
                    if ($isSubmitted || $hasContent || $hasImage) {
                        $submittedCount++;
                    }
                }
                
                if ($submittedCount < count($fields)) {
                    $allRecipientsSubmitted = false;
                    break;
                }
            }

            return response()->json([
                'status'       => true,
                'success_code' => 2000,
                'message'      => 'Field values saved successfully',
                'data'         => [
                    'updated_fields' => count($updatedFields),
                    'all_recipients_submitted' => $allRecipientsSubmitted
                ]
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

    public function saveFieldAssignments(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'template_id' => 'required|integer',
                'user_id' => 'required|integer',
                'fields' => 'required|array',
                'fields.*.id' => 'required|string',
                'fields.*.recipientId' => 'required|integer',
                'fields.*.content' => 'nullable|string',
                'fields.*.fieldType' => 'nullable|string',
                'fields.*.page' => 'required|integer',
                'fields.*.x' => 'required|numeric',
                'fields.*.y' => 'required|numeric',
                'fields.*.width' => 'nullable|numeric',
                'fields.*.height' => 'nullable|numeric',
                'fields.*.imageData' => 'nullable|string',
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
            $userId = $request->user_id;
            $fields = $request->fields;

            $groupedByRecipient = [];
            foreach ($fields as $field) {
                $recipientId = $field['recipientId'];
                if (!isset($groupedByRecipient[$recipientId])) {
                    $groupedByRecipient[$recipientId] = [];
                }
                
                $fieldData = [
                    'id' => $field['id'],
                    'content' => $field['content'],
                    'fieldType' => $field['fieldType'] ?? 'text',
                    'page' => $field['page'],
                    'x' => $field['x'],
                    'y' => $field['y'],
                ];
                
                // Include width and height if provided
                if (isset($field['width'])) {
                    $fieldData['width'] = $field['width'];
                }
                if (isset($field['height'])) {
                    $fieldData['height'] = $field['height'];
                }
                
                // Include imageData for signature/stamp fields
                if (isset($field['imageData'])) {
                    $fieldData['imageData'] = $field['imageData'];
                }
                
                $groupedByRecipient[$recipientId][] = $fieldData;
            }

            $updated = [];
            foreach ($groupedByRecipient as $recipientId => $fields) {
                $updated[] = DB::table('share_recipients')
                    ->where('template_id', $templateId)
                    ->where('user_id', $userId)
                    ->where('recipient_id', $recipientId)
                    ->update([
                        'field_json' => json_encode($fields),
                        'updated_at' => now(),
                    ]);
            }

            return response()->json([
                'status'       => true,
                'success_code' => 2000,
                'message'      => 'Field assignments saved successfully',
                'data'         => [
                    'updated_records' => array_sum($updated)
                ]
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

    public function sendShareEmail(Request $request)
    {
        try {

            $validator = Validator::make($request->all(), [
                'recipient_ids'   => 'required|array|min:1',
                'recipient_ids.*' => 'required|integer|exists:recipients,id',
                'template_id' => 'required|integer',
                'user_id' => 'required|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status'      => false,
                    'error_code'  => 422,
                    'message'     => 'Validation failed',
                    'errors'      => $validator->errors(),
                ], 422);
            }

            $recipientIds = $request->recipient_ids;
            $userId       = $request->user_id;
            $templateId   = $request->template_id;

            // ----------------------------------
            // GET DOCUMENT NAME (from request or use default)
            // ----------------------------------
            $documentName = $request->document_name ?? $request->file_name ?? 'Document';

            // ----------------------------------
            // GET SENDER RECIPIENT DATA (sender is a recipient with id = user_id)
            // ----------------------------------
            $senderRecipient = DB::table('recipients')
                ->where('id', $userId)
                ->where('status', 1)
                ->select('id', 'first_name', 'last_name', 'email')
                ->first();

            if (!$senderRecipient) {
                return response()->json([
                    'status'     => false,
                    'error_code' => 404,
                    'message'    => 'Sender recipient not found'
                ], 404);
            }

            // Create sender object with full name
            $senderName = trim(($senderRecipient->first_name ?? '') . ' ' . ($senderRecipient->last_name ?? ''));
            $sender = (object)[
                'id' => $senderRecipient->id,
                'name' => $senderName ?: 'Someone',
                'email' => $senderRecipient->email
            ];

            // ----------------------------------
            // GET RECIPIENTS (receivers)
            // ----------------------------------
            $recipients = DB::table('recipients')
                ->whereIn('id', $recipientIds)
                ->where('created_by', $userId)
                ->where('status', 1)
                ->select('id', 'email', 'first_name', 'last_name')
                ->get();

            if (count($recipients) != count($recipientIds)) {
                return response()->json([
                    'status'     => false,
                    'error_code' => 403,
                    'message'    => 'One or more recipients do not belong to this user'
                ], 403);
            }

            $emailsSent = 0;
            foreach ($recipients as $rec) {

                // Generate unique UUID token for each recipient
                $token = Str::uuid()->toString();

                // Create link using UUID token
                $secureLink = route('shared.document.link', $token);

                // Store token in share_recipients table
                $exists = DB::table('share_recipients')
                    ->where('template_id', $templateId)
                    ->where('user_id', $userId)
                    ->where('recipient_id', $rec->id)
                    ->exists();

                if ($exists) {
                    // Update existing record with new token
                    DB::table('share_recipients')
                        ->where('template_id', $templateId)
                        ->where('user_id', $userId)
                        ->where('recipient_id', $rec->id)
                        ->update([
                            'token' => $token,
                            'link' => $secureLink,
                            'status' => 0,
                            'send_date_time' => now(),
                            'updated_at' => now()
                        ]);
                } else {
                    // Insert new record with token
                    DB::table('share_recipients')
                        ->insert([
                            'template_id' => $templateId,
                            'user_id' => $userId,
                            'recipient_id' => $rec->id,
                            'token' => $token,
                            'date' => now(),
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                }

                $recipientData = (object)[
                    'id' => $rec->id,
                    'email' => $rec->email,
                    'first_name' => $rec->first_name
                ];

                try {
                    $customSubject = $request->subject ?? null;
                    $customBody = $request->body ?? null;
                    Mail::to($rec->email)->send(new ShareRecipientMail($sender, $recipientData, $secureLink, $documentName, $customSubject, $customBody));
                    $emailsSent++;
                } catch (Exception $e) {
                    \Log::error('Failed to send email to ' . $rec->email . ': ' . $e->getMessage());
                }
            }

            return response()->json([
                'status'       => true,
                'success_code' => 2000,
                'message'      => 'Emails sent successfully',
                'data'         => [
                    'emails_sent' => $emailsSent,
                    'total_recipients' => count($recipients)
                ]
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

    public function getTemplateData(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'template_id' => 'required|integer',
                'user_id' => 'required|integer',
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
            $userId = $request->user_id;

            // Get all share_recipients for this template and user
            $shareRecipients = DB::table('share_recipients')
                ->join('recipients', 'share_recipients.recipient_id', '=', 'recipients.id')
                ->where('share_recipients.template_id', $templateId)
                ->where('share_recipients.user_id', $userId)
                ->where('recipients.status', 1)
                ->select(
                    'share_recipients.*',
                    'recipients.first_name',
                    'recipients.last_name',
                    'recipients.email'
                )
                ->orderBy('share_recipients.id', 'DESC')
                ->get();

            // Format the data
            $formattedData = $shareRecipients->map(function($item) {
                $fields = [];
                if (!empty($item->field_json)) {
                    $fields = json_decode($item->field_json, true);
                    if (!is_array($fields)) {
                        $fields = [];
                    }
                }

                // Generate link from token if token exists
                $link = null;
                if (!empty($item->token)) {
                    $link = route('shared.document.link', $item->token);
                }

                return [
                    'id' => $item->id,
                    'template_id' => $item->template_id,
                    'recipient_id' => $item->recipient_id,
                    'recipient_name' => trim(($item->first_name ?? '') . ' ' . ($item->last_name ?? '')),
                    'recipient_email' => $item->email ?? '',
                    'fields' => $fields,
                    'token' => $item->token ?? null,
                    'link' => $link,
                    'date' => $item->date ?? null,
                    'created_at' => $item->created_at ?? null,
                    'updated_at' => $item->updated_at ?? null,
                ];
            });

            $allRecipientsSubmitted = $formattedData->every(function ($recipient) {
                $fields = $recipient['fields'];
                if (empty($fields)) {
                    return false; // Or true if no fields means "submitted"? Assuming false for now if they exist but are empty, or maybe true?
                    // Actually, if there are no fields assigned, is it submitted?
                    // Let's check the logic in getRecipientsByTemplate:
                    // 'is_fully_submitted' => count($fields) > 0 && count($fields) === count($submittedFields),
                    // So if count($fields) is 0, it is NOT fully submitted.
                }
                
                $submittedFields = array_filter($fields, function ($field) {
                    if (!is_array($field)) return false;
                    if (isset($field['isSubmitted']) && $field['isSubmitted']) return true;
                    if (!empty($field['content'])) return true;
                    if (!empty($field['imageData'])) return true;
                    return false;
                });
                
                return count($fields) > 0 && count($fields) === count($submittedFields);
            });

            return response()->json([
                'status'       => true,
                'success_code' => 2000,
                'message'      => 'Template data fetched successfully',
                'data'         => [
                    'template_id' => $templateId,
                    'user_id' => $userId,
                    'share_recipients' => $formattedData,
                    'total_recipients' => $formattedData->count(),
                    'all_recipients_submitted' => $allRecipientsSubmitted
                ]
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
