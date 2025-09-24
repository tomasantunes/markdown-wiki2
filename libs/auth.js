var nodemailer = require('nodemailer');

// This function sends an email to the user with the authentication PIN.
function sendPinEmail(pin) {
  var transport = nodemailer.createTransport({
    host: secretConfig.SMTP_HOST,
    port: secretConfig.SMTP_PORT,
    auth: {
      user: secretConfig.SMTP_EMAIL,
      pass: secretConfig.SMTP_PASSWORD
    }
  });

  var mailOptions = {
    from: secretConfig.SMTP_EMAIL,
    to: secretConfig.RECIPIENT_EMAIL,
    subject: 'PIN',
    text: 'We received a request to login to your account at ' + secretConfig.SITENAME + '. Please enter the following PIN to login: \n\n' + pin + '\n\n This PIN will expire in 1 hour.'
  };

  transport.sendMail(mailOptions, function(error, response){
      if(error){
          console.log(error);
      }else{
          console.log("Email has been sent successfully.");
      }
  });
}

module.exports = {
    sendPinEmail,
    default: {
        sendPinEmail
    }
};