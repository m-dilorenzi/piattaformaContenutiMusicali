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
  
  const clientreq = https.request({
    method: 'POST',
    host: 'api.telegram.org',
    path: '/bot' + process.env.BOTTOKEN + '/getMe'
  }, function(resp) {
    // Questa funzione viene richiamata a richiesta eseguita
    if(resp.statusCode != 200) {
      console.log("Richiesta HTTP fallita");
      return;
    }
    console.log("Richiesta HTTP riuscita");
    
    var body = '';
    resp.on('data', function(d) {
        body += d;
    });
    resp.on('end', function() {
      // Ora body contiene il contenuto (corpo) della risposta
      console.log("Risposta da API Telegram: " + body);
      
      const j = JSON.parse(body);
      // j è un oggetto JavaScript che contiene i dati della risposta
      // ...
    });
  });
  clientreq.end(); // questa chiamata esegue la richiesta
  
});

const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
