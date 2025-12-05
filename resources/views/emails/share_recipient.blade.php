<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{{ $sender->name ?? 'Someone' }} sent you {{ $documentName ?? 'Document' }} via DocuCrafter</title>
<style>
  .container {
    background-color: rgb(229, 229, 229);
    padding: 20px 40px 30px;
    box-sizing: border-box;
    text-align: center !important;
    display: block;
    justify-content: center;
    align-items: center;
  }
  .logo {
    display: block;
    margin: 0 auto 20px;
  }
  .message-box {
    background: white;
    padding: 2rem;
  }
  .avatar {
    width: 45px;
    height: 45px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 24px;
    color: #999;
    border-radius: 2px;
    flex-shrink: 0;
  }
  .message-text {
    font-size: 14px;
    color: #333;
    text-align: left;
  }
  .message-text b {
    font-weight: 700;
  }
  .buttons {
    display: flex;
    justify-content: center;
    gap: 15px;
  }
  .btn {
    cursor: pointer;
    border: 1px solid #fff;
    padding: 10px 25px;
    font-size: 14px;
    text-transform: uppercase;
    font-weight: 700;
    border-radius: 2px;
    background: #248567;
    color: white !important;
    transition: background 0.3s ease;
    text-decoration: none !important;
    min-width: 150px;
  }
  .btn.forward {
    background: #fff;
    color: #999;
    border: 1px solid #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .btn.forward svg {
    fill: #ccc;
  }
  .btn:hover {
    background: #248567;
  }
  .btn.forward:hover {
    background: #f7f7f7;
    border-color: #bbb;
    color: #666;
  }
  .footer {
    font-size: 12px;
    color: #767676;
    margin-top: 25px;
    text-align: center;
  }
  .report {
    color: #999;
    font-size: 13px;
    display: flex;
    align-items: center !important;
    justify-content: center;
    text-align: center !important;
    gap: 5px;
    margin-top: 10px;
    margin-bottom: 10px;
  }
  .report svg {
    fill: #999;
  }
</style>
</head>
<body>
  <div class="container" style="justify-content: center;">
  <div style="width: 500px; display: inline-block;">
    <div style="text-align: center; padding: 16px 0 16px 0;">
      <img src="{{ $message->embed(public_path('logo.png')) }}" style="object-fit: contain; width: 100px;">
    </div>
    <div class="message-box">
      <div style="display: flex; gap: 1rem; ">
        <img style="margin: 0 20px 0 0;" src="https://ci3.googleusercontent.com/meips/ADKq_NY2LUHGL3wmmPENsc4iv9xmslLnl0gPMWX5B2mGvBWK0fu42WwrnU_M5glSKE25p7L7srzQSiG8Z_EPCInuQYSgwx6nWp7wDTJjR0fEeJOwG2kIlGiUL_QnOSR0hA=s0-d-e1-ft#https://api.pandadoc.com/avatar/?q=maulik.makadiya0411%40gmail.com&amp;s=40" alt="" width="50" height="50" class="CToWUd" data-bit="iit">
        <div class="message-text">
          @if(!empty($customBody))
              <p style="font-family:'Helvetica Neue','Helvetica',Arial,sans-serif;font-size:15px;color:#333b40;margin:0;padding:0;border-collapse:collapse;line-height:22px!important"> {!! nl2br(e($customBody)) !!}</p>
          @else
              <p style="font-family:'Helvetica Neue','Helvetica',Arial,sans-serif;font-size:15px;color:#333b40;margin:0;padding:0;border-collapse:collapse;line-height:22px!important"><b>{{ $sender->name ?? 'Someone' }}</b> sent you <b>{{ $documentName ?? 'Document' }}.</b></p>
          @endif
        </div>
      </div>
      <div style="margin: 16px 0 16px 0; height: 1px; background: #eaeaea;"></div>
      <div class="buttons" style="display: block;">
        <a style="display: inline-block;" href="{{ $link }}" class="btn open-btn">Open the Document</a>
      </div>
    </div>
    <div class="footer">
      Use DocuCrafter to create, send, track, and eSign documents — quickly and securely.
    </div>
  </div>
  </div>
</body>
</html>
