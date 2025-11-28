    <!DOCTYPE html>
    <html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Document</title>
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    </head>

    <body>
        <div id="app" 
             data-token="{{ $token ?? '' }}"
             data-assigned-fields="{{ htmlspecialchars(json_encode($assignedFields ?? []), ENT_QUOTES, 'UTF-8') }}"
             data-recipient="{{ htmlspecialchars(json_encode($recipient ?? null), ENT_QUOTES, 'UTF-8') }}"
             data-template="{{ htmlspecialchars(json_encode($template ?? null), ENT_QUOTES, 'UTF-8') }}">
        </div>
        <script>
            // Pass assigned fields data to React app
            window.sharedDocumentData = {
                token: @json($token ?? null),
                assignedFields: @json($assignedFields ?? []),
                recipient: @json($recipient ?? null),
                template: @json($template ?? null),
                allRecipientsSubmitted: @json($allRecipientsSubmitted ?? false)
            };
            console.log('Shared document data loaded:', window.sharedDocumentData);
        </script>
    </body>

    </html>
