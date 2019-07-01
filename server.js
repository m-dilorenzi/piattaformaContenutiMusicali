const util = require('util');
const express = require('express');
const app = express();

// Includiamo la libreria "body-parser" per gestire le richieste in JSON.
const bodyparser = require('body-parser');
app.use(bodyparser.json());

// Includiamo il modulo "request" per effettuare richieste HTTP
const https = require('https');

// Webhook per Telegram
app.post('/telegram', (req, res) => {
	console.log("Richiesta: " + JSON.stringify(req.body));
	const chatid = req.body.message.chat.id;
	const text = req.body.message.text;
	
	console.log("Utente in chat " + chatid + " ha scritto '" + text + "'");
	
	sendText(chatid, text);
	
	res.end();
  
});

const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

function sendText(chatId, text){
  const requestBody = { 
	      chat_id: chatId,
	      text: text
  }
  
  const clientreq = https.request({
    method: 'POST',
    host: 'api.telegram.org',
    path: '/bot' + process.env.BOTTOKEN + '/sendMessage',
    headers: {
	    'Content-Type':'application/json',
    },	  
  }, function(resp) {
    // Questa funzione viene richiamata a richiesta eseguita
    if(resp.statusCode != 200) {
      console.log("Richiesta HTTP fallita");
      return;
    }
    console.log("Richiesta HTTP riuscita");
       
  });
  clientreq.write(JSON.stringify(requestBody));	
  clientreq.end(); // questa chiamata esegue la richiesta
}

// link alle API esterne:
// https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/#legal

