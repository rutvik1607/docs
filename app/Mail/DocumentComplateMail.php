<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DocumentComplateMail extends Mailable
{
    use Queueable, SerializesModels;

    public $downloadLink;
    public $documentName;

    /**
     * Create a new message instance.
     */
    public function __construct($downloadLink, $documentName = 'Document')
    {
        $this->downloadLink = $downloadLink;
        $this->documentName = $documentName;
    }

    public function build()
    {
        $subject = '"'.$this->documentName.'" document has been completed by all participants';
        
        return $this->subject($subject)
            ->view('emails.all_recipient_completeDoc')
            ->with([
                'downloadLink' => $this->downloadLink,
                'documentName' => $this->documentName,
            ]);
    }
}
