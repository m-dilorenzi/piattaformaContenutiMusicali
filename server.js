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
	
  process.env.COMMAND_OR_INPUT = 1;
  
  if(text == "/start"){
    sendText(chatid, "Benvenuto nel bot. Visita la lista dei comandi.");
    process.env.COMMAND_OR_INPUT = 0;
    process.env.ACTION_TO_DO = 0;
  }
  if(text == "/searchsongbyparameter"){
    sendText(chatid, "Digita i termini con cui eseguire la ricerca");
    process.env.COMMAND_OR_INPUT = 0;
    process.env.ACTION_TO_DO = 1;
  }
  if(text == "/getartistpagebyname"){
    sendText(chatid, "Digita il nome dell'autore");
    process.env.COMMAND_OR_INPUT = 0;
    process.env.ACTION_TO_DO = 2;
  }
  
  if(process.env.COMMAND_OR_INPUT == 1){
    if((process.env.ACTION_TO_DO == 1) || (process.env.ACTION_TO_DO == 2)){
      if(process.env.ACTION_TO_DO == 1){
        getMusicByParameter(chatid, text);
        process.env.ACTION_TO_DO = 0;
      }
      if(process.env.ACTION_TO_DO == 2){
        getArtistPageByName(chatid, text);
        process.env.ACTION_TO_DO = 0;
      }
    }else{
      sendText(chatid, "Comando non disponibile.");
    }
	}
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

function getMusicByParameter(chatId, text){
  const requestBody = { 
	      chat_id: chatId,
  }
  
  // console.log(text);
  var searchString = text;
  searchString = searchString.replace(/\s/g,"+");
  // console.log(searchString);
  
  const clientreq = https.request({
    method: 'GET',
    host: 'itunes.apple.com',
    path: '/search?term='+ searchString +'&attributeType=music&limit=10',
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
          string += "\nPrezzo: " + j.results[i].trackPrice+ "€";
		  string += "\nLink:   " + j.results[i].trackViewUrl;
          string += "\n";
        }
      }
      sendText(chatId, string);
    });
  });
	
  clientreq.end(); // questa chiamata esegue la richiesta

}

function getArtistPageByName(chatId, text){
  const requestBody = { 
	      chat_id: chatId,
  }
  
  // console.log(text);
  var searchString = text;
  searchString = searchString.replace(/\s/g,"+");
  // console.log(searchString);
  
  const clientreq = https.request({
    method: 'GET',
    host: 'itunes.apple.com',
    path: '/search?term='+ searchString +'&attributeType=allArtist&entity=allArtist&limit=5',
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
        string += "Lista artisti\n"
        for(var i=0; i < j.resultCount; i++){
          string += "\nNome: " + j.results[i].artistName;
          string += "\nLink pagina iTunes: "+j.results[i].artistLinkUrl;
          string += "\n";
        }
      }
      sendText(chatId, string);
    });
  });
	
  clientreq.end(); // questa chiamata esegue la richiesta

}