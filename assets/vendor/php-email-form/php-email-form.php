<?php
/**
* PHP Email Form Library - v3.6
* URL: https://bootstrapmade.com/php-email-form/
* Author: BootstrapMade.com
*/

class PHP_Email_Form {

  public $to = '';
  public $from_name = '';
  public $from_email = '';
  public $subject = '';
  public $smtp = array();
  public $ajax = false;
  private $messages = array();
  private $error = '';

  public function add_message($content, $label, $priority = 0) {
    $this->messages[] = array('content' => $content, 'label' => $label, 'priority' => $priority);
  }

  public function send() {
    if (empty($this->to)) {
      $this->error = 'Recipient email address is missing!';
      return false;
    }

    $headers = 'From: ' . $this->from_name . ' <' . $this->from_email . '>' . "\r\n";
    $headers .= 'Reply-To: ' . $this->from_email . "\r\n";
    $headers .= 'Content-Type: text/html; charset=UTF-8' . "\r\n";

    $message_content = '';
    usort($this->messages, function($a, $b) {
      return $a['priority'] - $b['priority'];
    });

    foreach ($this->messages as $msg) {
      $message_content .= '<p><strong>' . $msg['label'] . ':</strong> ' . nl2br($msg['content']) . '</p>';
    }

    if (!empty($this->smtp)) {
      return $this->send_smtp($message_content, $headers);
    } else {
      return mail($this->to, $this->subject, $message_content, $headers);
    }
  }

  private function send_smtp($message_content, $headers) {
    $mail = new PHPMailer();
    $mail->isSMTP();
    $mail->Host = $this->smtp['host'];
    $mail->SMTPAuth = true;
    $mail->Username = $this->smtp['username'];
    $mail->Password = $this->smtp['password'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = $this->smtp['port'];

    $mail->setFrom($this->from_email, $this->from_name);
    $mail->addAddress($this->to);
    $mail->addReplyTo($this->from_email, $this->from_name);

    $mail->isHTML(true);
    $mail->Subject = $this->subject;
    $mail->Body = $message_content;
    $mail->AltBody = strip_tags($message_content);

    if ($mail->send()) {
      return true;
    } else {
      $this->error = 'Mailer Error: ' . $mail->ErrorInfo;
      return false;
    }
  }
}
?>
