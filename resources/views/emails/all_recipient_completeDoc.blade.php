<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{{ $documentName ?? 'Document' }} document has been completed by all participants</title>
<style>
  body {
    margin: 0;
    background-color: #d9d9d9;
    font-family: Arial, sans-serif;
    display: flex;
    justify-content: center;
    padding: 40px 20px;
  }
  .container {
    background-color: #fff;
    padding: 20px 40px 30px;
    max-width: 500px;
    box-sizing: border-box;
    text-align: center !important;
  }
  .logo {
    display: block;
    margin: 0 auto 20px;
  }
  .message-box {
    border-top: 1px solid #ddd;
    border-bottom: 1px solid #ddd;
    padding: 15px 0;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 15px;
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
    margin-left: 10px !important;
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
    color: #999;
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
  <div class="container">
    <div class="message-box">
      <div class="avatar" aria-label="Profile Icon">&#128100;</div>
      <div class="message-text">
        <b>{{ $documentName ?? 'Document' }} document has been completed by all participants</b>
      </div>
    </div>
    <div class="buttons">
      <a href="{{ $link }}" class="btn open-btn">Open The Document</a>
    </div>
    <div class="footer">
      Use DocuCrafter to create, send, track, and eSign documents — quickly and securely.
    </div>
  </div>
</body>
</html>
