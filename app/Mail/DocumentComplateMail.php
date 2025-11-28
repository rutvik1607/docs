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

    public $link;
    public $documentName;

    /**
     * Create a new message instance.
     */
    public function __construct($link, $documentName = 'Document')
    {
        $this->link = $link;
        $this->documentName = $documentName;
    }

    public function build()
    {
        $subject = '"'.$this->documentName.'" document has been completed by all participants';
        
        return $this->subject($subject)
            ->view('emails.all_recipient_completeDoc')
            ->with([
                'link' => $this->link,
                'documentName' => $this->documentName,
            ]);
    }
}
