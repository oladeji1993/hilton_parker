const axios = require('axios');


var data = {
    "to":"2349043395167",
    "from":"hps",
    "sms":"Hi there, testing Termii",
    "type":"plain",
    "api_key":"TLuDQanbi2M73KeTP6MEdds6PjFm6zukHQb59yHOq4gvOdJE0OjdlPgYy0uPaG",
    "channel":"whatsapp" 
};
var options = {
    'method': 'POST',
    'url': 'https://termii.com/api/sms/send',
    'headers': {
        'Content-Type': ['application/json', 'application/json']
    },
    body: JSON.stringify(data)
    
};

module.exports = axios(options).then((response) => {
      console.log(response)
  })
