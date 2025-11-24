<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ShareRecipientMail extends Mailable
{
    use Queueable, SerializesModels;

    public $sender;
    public $recipient;
    public $link;
    public $documentName;

    public function __construct($sender, $recipient, $link, $documentName = 'Document')
    {
        $this->sender = $sender;
        $this->recipient = $recipient;
        $this->link      = $link;
        $this->documentName = $documentName;
    }

    public function build()
    {
        $senderName = $this->sender->name ?? 'Someone';
        $subject = $senderName . ' sent you ' . $this->documentName . ' via DocuCrafter';
        
        return $this->subject($subject)
            ->view('emails.share_recipient')
            ->with([
                'sender' => $this->sender,
                'name' => $this->recipient->first_name,
                'link' => $this->link,
                'documentName' => $this->documentName,
            ]);
    }
}
