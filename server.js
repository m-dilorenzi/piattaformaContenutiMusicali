const util = require('util');
const express = require('express');
var querystring = require('querystring');
const app = express();

// Includiamo la libreria "body-parser" per gestire le richieste in JSON.
const bodyparser = require('body-parser');
app.use(bodyparser.json());

// Includiamo il modulo "request" per effettuare richieste HTTP
const https = require('https');


setInterval(function(){
  checkTokenValidity(process.env.SPOTIFY_ACCESS_TOKEN);
},120000);

// Webhook per Telegram
app.post('/telegram', (req, res) => {
	console.log("Richiesta: " + JSON.stringify(req.body));
	const chatid = req.body.message.chat.id;
  const text = req.body.message.text;
  const clientid = req.body.message.from.id;
	
	console.log("Utente in chat " + chatid + " ha scritto '" + text + "'");
  
  process.env.COMMAND_OR_INPUT = 1;
  
  if(text == "/start"){
    sendText(chatid, "Benvenuto nel bot. Digita il comando /help per visualizzare i possibili comandi che il bot mette a disposizione.");
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
  if(text == "/searchyoutubevideos"){
    sendText(chatid, "Digita i termini della ricerca");
    process.env.COMMAND_OR_INPUT = 0;
    process.env.ACTION_TO_DO = 3;
  }
  if(text == "/searchsongonspotify"){
    if(clientid == process.env.ADMIN_ID){
      sendText(chatid, "Digita i termini della ricerca");
      process.env.COMMAND_OR_INPUT = 0;
      process.env.ACTION_TO_DO = 4;
    }else{
      sendText(chatid, "Funzione riservata all'utente admin.");
      process.env.COMMAND_OR_INPUT = 0;
      process.env.ACTION_TO_DO = 0;
    }
  }

  if(text == "/help"){
    showInformation(chatid);
    process.env.COMMAND_OR_INPUT = 0;
    process.env.ACTION_TO_DO = 0;
  }
  
  if(process.env.COMMAND_OR_INPUT == 1){
    if((process.env.ACTION_TO_DO == 1) || 
       (process.env.ACTION_TO_DO == 2) ||
       (process.env.ACTION_TO_DO == 3) ||
       (process.env.ACTION_TO_DO == 4)){
      if(process.env.ACTION_TO_DO == 1){
        getMusicByParameter(chatid, text);
        process.env.ACTION_TO_DO = 0;
      }
      if(process.env.ACTION_TO_DO == 2){
        getArtistPageByName(chatid, text);
        process.env.ACTION_TO_DO = 0;
      }
      if(process.env.ACTION_TO_DO == 3){
        searchYoutubeVideos(chatid, text);
        process.env.ACTION_TO_DO = 0;
      }
      if(process.env.ACTION_TO_DO == 4){
        console.log("Eseguo la ricerca su Spotify");
        process.env.ACTION_TO_DO = 0;
        searchSongOnSpotify(chatid, text, process.env.SPOTIFY_ACCESS_TOKEN);
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
      return;
    }  
  });
  clientreq.write(JSON.stringify(requestBody));	
  clientreq.end(); // questa chiamata esegue la richiesta
}

function getMusicByParameter(chatId, text){
  
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


function showInformation(chatId){
  var string = "Benvenuto nel bot FindYourFavouriteMusic!";
  string += "\nI possibili comandi sono:";
  string += "\n1. /searchsongbyparameter";
  string += "\n  Permette di ricercare una canzone o una lista di canzoni tramite ";
  string += "parametri come nome della canzone, artista, album, ecc.ecc. La ricerca ";
  string += "puo' essere eseguita anche tramite un insieme di termini.";
  string += "\n2. /getartistpagebyname";
  string += "\n  Permette di ricercare la pagina iTunes di un cantante ";
  string += "(o le pagine nel caso in cui i risultati della ricerca siano piu' di uno) ";
  string += "alla quale si potra' poi accedere successivamente tramite l'apposito link ";
  string += "che verra' mostrato.";
  string += "\n3. /searchyoutubevideos";
  string += "\n  Mostra i primi 5 video su YouTube che soddisfano ";
  string += "i requisiti specificati nella ricerca.";
  string += "\n4. /searchsongonspotify";
  string += "\n  Mostra al pi? 5 canzoni con il rispettivo link di Spotify che ";
  string += "soddisfano i requisiti specificati nella ricerca dall'utente.";
  
  sendText(chatId, string);
}

function searchYoutubeVideos(chatId, text) {
  
  var searchString = text;
  searchString = searchString.replace(/\s/g,"+");
  
  const clientreq = https.request({
    method: 'GET',
    host: 'www.googleapis.com',
    path: 'https://www.googleapis.com/youtube/v3/search?part=id&q='+searchString+'&type=video&maxResults=5'+
          '&key='+process.env.YOUTUBEKEY,
    headers: {
	    'Content-Type':'application/json',
    },	  
  }, function(resp) {
    // Questa funzione viene richiamata a richiesta eseguita
    if(resp.statusCode != 200) {
      console.log("Richiesta HTTP YoutubeAPI fallita");
      console.log(resp.statusCode);
      return;
    }
    console.log("Richiesta HTTP YoutubeAPI riuscita");
    
    var body = '';
    resp.on('data', function(d) {
        body += d;
    });
    resp.on('end', function() {
      
      const j = JSON.parse(body);
      //console.log(j);
      
      var searchStringStatistics = '';
      if(j.totalResults != 0){
        for(var i=0; i < 5; i++){
          searchStringStatistics += j.items[i].id.videoId;
          if(i!=4)
            searchStringStatistics += "%2C+";
        }
        searchVideoStatistics(chatId, searchStringStatistics);
      }else{
        return;
      }
    });
  });
	
  clientreq.end(); // questa chiamata esegue la richiesta
  
}

function searchVideoStatistics(chatId, text){
  console.log("Esecuzione richiesta statistiche video");
  const clientreq = https.request({
    method: 'GET',
    host: 'www.googleapis.com',
    path: 'https://www.googleapis.com/youtube/v3/videos?part=snippet&id='+text+'&maxResults=5'+
          '&key='+process.env.YOUTUBEKEY,
    headers: {
	    'Content-Type':'application/json',
    },	  
  }, function(resp) {
    // Questa funzione viene richiamata a richiesta eseguita
    if(resp.statusCode != 200) {
      console.log("Richiesta HTTP YoutubeAPI Statistics fallita");
      console.log(resp.statusCode);
      return;
    }
    console.log("Richiesta HTTP YoutubeAPI Statistics riuscita");
    
    var body = '';
    resp.on('data', function(d) {
        body += d;
    });
    resp.on('end', function() {
      
      const j = JSON.parse(body);
      //console.log(j);
      
      var string = '';
      if(j.totalResults == 0)
        string += "Nessun risultato disponibile";
      else{
        string += "Lista video\n";
        for(var i=0; i < 5; i++){
          string += "\n"+(i+1)+". Titolo: "+ j.items[i].snippet.title;
          string += "\n     Link: www.youtube.com/watch?v=" + j.items[i].id +" \n\n"
        }
      }
      sendText(chatId, string);
    });
  });
  clientreq.end(); // questa chiamata esegue la richiesta
}

function searchSongOnSpotify(chatId, text, token){
  var searchString = text;
  searchString = searchString.replace(/\s/g,"+");
  
  const clientreq = https.request({
    method: 'GET',
    host: 'api.spotify.com',
    path: '/v1/search?q='+searchString+'&type=track&limit=5&access_token='+token,
    headers: {
	    'Content-Type':'application/json',
    },	  
  }, function(resp) {
    // Questa funzione viene richiamata a richiesta eseguita
    if(resp.statusCode != 200) {
      console.log("Richiesta HTTP Spotify fallita");
      console.log(resp.statusCode);
      return;
    }
    console.log("Richiesta HTTP Spotify riuscita");
    
    var body = '';
    resp.on('data', function(d) {
        body += d;
    });
    resp.on('end', function() {
      
      const j = JSON.parse(body);
      // console.log(j);
      var string = '';
      string += "Lista canzoni\n"
      
      for(var i=0; i<j.tracks.limit && i<j.tracks.total;i++){
        string += "\n"+(i+1)+". Titolo: "+j.tracks.items[i].name;
        string += "\n     Autore: "+j.tracks.items[i].artists[0].name;
        string += "\n     Link: "+j.tracks.items[i].external_urls.spotify;
      }
      sendText(chatId, string);
    });
  });
  clientreq.end(); // questa chiamata esegue la richiesta
}

function getNewAccessToken(){
  var bodyRequest = querystring.stringify({
    grant_type: 'refresh_token',
    refresh_token: process.env.SPOTIFYKEYREFRESH
  });
  
  const clientreq = https.request({
    method: 'POST',
    host: 'accounts.spotify.com',
    path: '/api/token',
    headers: {
      'Content-Type':'application/x-www-form-urlencoded',
	    'Authorization':'Basic '+process.env.SPOTIFYBASE64ID
    },	  
  }, function(resp) {
    // Questa funzione viene richiamata a richiesta eseguita
    if(resp.statusCode != 200) {
      console.log("Richiesta HTTP Spotify NewToken fallita");
      console.log(resp.statusCode);
      return;
    }
    console.log("Richiesta HTTP Spotify NewToken riuscita");
    
    var body = '';
    resp.on('data', function(d) {
        body += d;
    });
    resp.on('end', function() {
      
      const j = JSON.parse(body);
      var token = j.access_token;
      process.env.SPOTIFY_ACCESS_TOKEN = token;
      console.log("Nuovo token ottenuto.");
    });
  });
  //console.log(clientreq);
  clientreq.write(bodyRequest);
  clientreq.end(); // questa chiamata esegue la richiesta
  
}

function checkTokenValidity(token){
  process.env.LOCK = 1;
  var searchString = "prova";
  const clientreq = https.request({
    method: 'GET',
    host: 'api.spotify.com',
    path: '/v1/search?q='+searchString+'&type=track&limit=5&access_token='+token,
    headers: {
	    'Content-Type':'application/json',
    },	  
  }, function(resp) {
    // Questa funzione viene richiamata a richiesta eseguita
    if(resp.statusCode != 200) {
      getNewAccessToken();
    }else{
      console.log("Token valido.");
    }
  });
  clientreq.end(); // questa chiamata esegue la richiesta
}