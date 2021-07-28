const request = require('request');
require('dotenv').config()
const mailer = require('./mailers')



sendsms = (recipient, message) => {
  var data = {
    "to": `${recipient}`,
    "from":"HPS",
    "sms":`${message}`,
    "type":"plain",
    "api_key":process.env.TERMII_KEY,
    "channel":"generic" 
  };
var options = {
'method': 'POST',
'url': 'https://termii.com/api/sms/send',
'headers': {
'Content-Type': ['application/json', 'application/json']
},
body: JSON.stringify(data)

};
request(options, function (error, response) { 
if (error) mailer.smsStatus(error);
mailer.smsStatus(response)
});

}

sendEmail = () => {
  console.log('vhgfhgfhg')
}

module.exports = {sendsms, sendEmail}
