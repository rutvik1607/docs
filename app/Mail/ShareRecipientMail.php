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

    public function __construct($sender, $recipient, $link)
    {
        $this->sender = $sender;
        $this->recipient = $recipient;
        $this->link      = $link;
    }

    public function build()
    {
        return $this->subject('Maulik Makadiya sent you Gmail - Study mode in ChatGPT for back-to-school via DocuCrafter')
            ->view('emails.share_recipient')
            ->with([
                'sender' => $this->sender,
                'name' => $this->recipient->first_name,
                'link' => $this->link,
            ]);
    }
}
