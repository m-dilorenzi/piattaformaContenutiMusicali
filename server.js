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
	const text = req.body.message.text.toLowerCase();
	
	console.log("Utente in chat " + chatid + " ha scritto '" + text + "'");
	
	getMusic(chatid, text);
	// sendText(chatid, text);
	
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

function getMusic(chatId, text){
  const requestBody = { 
	      chat_id: chatId,
  }
  
  console.log(text);
  var searchString = text.replace(" ","+");
  console.log(searchString);
  
  const clientreq = https.request({
    method: 'GET',
    host: 'itunes.apple.com',
    path: '/search?term='+ searchString +'&attributeType=music&limit=5',
    headers: {
	    'Content-Type':'application/json',
    },	  
  }, function(resp) {
    // Questa funzione viene richiamata a richiesta eseguita
    if(resp.statusCode != 200) {
      console.log("Richiesta HTTP iTunes fallita");
      console.log(resp.statusCode);
      return;
    }
    console.log("Richiesta HTTP iTunes riuscita");
    
    var body = '';
    resp.on('data', function(d) {
        body += d;
    });
    resp.on('end', function() {
      // Ora body contiene il contenuto (corpo) della risposta
      // console.log("Risposta da API Telegram: " + body);
      
      const j = JSON.parse(body);
      // console.log(j);
      var string = '';
      if(j.resultCount == 0)
        string += "Nessun risultato disponibile";
      else{
        string += "Lista canzoni\n"
        for(var i=0; i < j.resultCount; i++){
          string += "\nTitolo: " + j.results[i].trackName;
          string += "\nAlbum:  " + j.results[i].collectionName;
          string += "\nAutore: " + j.results[i].artistName;
          string += "\nPrezzo: " + j.results[i].trackPrice;
          string += "\n";
        }
      }
      sendText(chatId, string);
    });
  });
	
  clientreq.end(); // questa chiamata esegue la richiesta

}