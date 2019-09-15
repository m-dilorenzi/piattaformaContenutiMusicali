const util = require('util');
const express = require('express');
var querystring = require('querystring');
const app = express();

// Includiamo la libreria "body-parser" per gestire le richieste in JSON.
const bodyparser = require('body-parser');
app.use(bodyparser.json());

// Includiamo il modulo "request" per effettuare richieste HTTP
const https = require('https');

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});


app.get('/searchiTunesSong/:text', (req, res) => {
  var text = req.params.text;
  console.log("L'utente vuole cercare dei brani su iTunes");
	var resultString;
  getMusicByParameter(text, function(result){
    res.end(result);
  });
});

app.get('/searchiTunesArtist/:text', (req, res) => {
  var text = req.params.text;
  console.log("L'utente vuole cercare un artista su iTunes");
  var resultString;
	getArtistPageByName(text, function(result){
    res.end(result);
  });
});

app.get('/searchYoutubeVideos/:text', (req, res) => {
  var text = req.params.text;
  console.log("L'utente vuole cercare video su YouTube");
  var resultString;
	searchYoutubeVideos(text, function(initialResult){
    if(initialResult != "Nessun risultato disponibile."){
      searchVideoStatistics(initialResult, function(finalResult){
        res.end(finalResult);
      });
    }else{
      var jsonObject={};
      jsonObject.tipoRisultato = "YouTubeVideo";
      jsonObject.risultatiTotali=0;
      jsonObject["items"]=[];
      res.end(JSON.stringify(jsonObject));
    }
  });
});

app.get('/searchSongOnSpotify/:text/:token', (req, res) => {
  var text = req.params.text;
  var token = req.params.token;
  console.log("L'utente vuole cercare brani su Spotify");
  var resultString;
	searchSongOnSpotify(text, token, function(result){
    res.end(result);
  });
});

app.get('/help', (req, res) => {
  console.log("L'utente vuole eseguire il comando di help");
  var resultString;
	showInformation(function(result){
    res.end(result);
  });
});

const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

function getMusicByParameter(text, result){
    
  const clientreq = https.request({
    method: 'GET',
    host: 'itunes.apple.com',
    path: '/search?term='+ text +'&attributeType=music&limit=5',
    headers: {
	    'Content-Type':'application/json',
    },	  
  }, function(resp) {
    // Questa funzione viene richiamata a richiesta eseguita
    if(resp.statusCode != 200) {
      console.log("Richiesta HTTP iTunes fallita");
      console.log(resp.statusCode);
      return "Errore...";
    }
    console.log("Richiesta HTTP iTunes riuscita");
    
    var body = '';
    resp.on('data', function(d) {
        body += d;
    });
    resp.on('end', function() {
      
      const j = JSON.parse(body);
      var string = '';
      var jsonObject={};
      jsonObject.tipoRisultato = "iTunesSong";
      jsonObject.risultatiTotali=j.resultCount;
      jsonObject["items"]=[];
      if(j.resultCount != 0){
        for(var i=0; i < j.resultCount; i++){
          var song = {
            nome: j.results[i].trackName,
            album: j.results[i].collectionName,
            autore: j.results[i].artistName,
            prezzo: j.results[i].trackPrice+ "€",
            link: j.results[i].trackViewUrl
          }
          jsonObject["items"].push(song);
        }
      }
      //console.log(jsonObject);
      result(JSON.stringify(jsonObject));
    });
  });
  clientreq.end(); // questa chiamata esegue la richiesta
}


function getArtistPageByName(text, result){
  
  const clientreq = https.request({
    method: 'GET',
    host: 'itunes.apple.com',
    path: '/search?term='+ text +'&attributeType=allArtist&entity=allArtist&limit=5',
    headers: {
	    'Content-Type':'application/json',
    },	  
  }, function(resp) {
    // Questa funzione viene richiamata a richiesta eseguita
    if(resp.statusCode != 200) {
      console.log("Richiesta HTTP iTunes fallita");
      console.log(resp.statusCode);
      return "Errore...";
    }
    console.log("Richiesta HTTP iTunes riuscita");
    
    var body = '';
    resp.on('data', function(d) {
        body += d;
    });
    resp.on('end', function() {
      
      const j = JSON.parse(body);
      
      var jsonObject={};
      jsonObject.tipoRisultato = "iTunesArtist";
      jsonObject.risultatiTotali=j.resultCount;
      jsonObject["items"]=[];
      
      if(j.resultCount != 0){
        for(var i=0; i < j.resultCount; i++){
          var artist={
            nome: j.results[i].artistName,
            album: 0,
            autore: 0,
            prezzo: 0,
            link: j.results[i].artistLinkUrl
          }
          jsonObject["items"].push(artist);
        }
      }
      //console.log(jsonObject);
      result(JSON.stringify(jsonObject));
    });
  });
  clientreq.end(); // questa chiamata esegue la richiesta
}

function searchYoutubeVideos(text, initialResult) {
    
  const clientreq = https.request({
    method: 'GET',
    host: 'www.googleapis.com',
    path: 'https://www.googleapis.com/youtube/v3/search?part=id&q='+text+'&type=video&maxResults=5'+
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
      if(j.pageInfo.totalResults != 0){
        for(var i=0; i < 5; i++){
          searchStringStatistics += j.items[i].id.videoId;
          if(i!=4)
            searchStringStatistics += "%2C+";
        }
        initialResult(searchStringStatistics);
      }else{
		    var string = "Nessun risultato disponibile."; 
        initialResult(string);
      }
    });
  });
	
  clientreq.end(); // questa chiamata esegue la richiesta
  
}

function searchVideoStatistics(text, finalResult){
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
      
      var jsonObject={};
      jsonObject.tipoRisultato = "YouTubeVideo";
      jsonObject.risultatiTotali=j.pageInfo.totalResults;
      jsonObject["items"]=[];
      
      if(j.pageInfo.totalResults != 0){
        for(var i=0; i < 5; i++){
          var video={
            nome: j.items[i].snippet.title,
            album: 0,
            autore: 0,
            prezzo: 0,
            link: "www.youtube.com/watch?v=" + j.items[i].id
          }
          jsonObject["items"].push(video);
        }
      }
      //console.log(jsonObject);
      finalResult(JSON.stringify(jsonObject));
    });
  });
  clientreq.end(); // questa chiamata esegue la richiesta
}

function searchSongOnSpotify(text, token, result){
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
      
      var jsonObject={};
      jsonObject.tipoRisultato = "SpotifySong";
      jsonObject["items"]=[];
      var c = 0;
      
      for(var i=0; i<j.tracks.limit && i<j.tracks.total;i++){
        c++;
        var video={
          nome: j.tracks.items[i].name,
          album: 0,
          autore: j.tracks.items[i].artists[0].name,
          prezzo: 0,
          link: j.tracks.items[i].external_urls.spotify
        }
        jsonObject["items"].push(video);
      }
      jsonObject.risultatiTotali=c;
      //console.log(jsonObject);
      result(JSON.stringify(jsonObject));
    });
  });
  clientreq.end(); // questa chiamata esegue la richiesta
}

function showInformation(result){
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
  string += "\n  Mostra al piu' 5 canzoni con il rispettivo link di Spotify che ";
  string += "soddisfano i requisiti specificati nella ricerca dall'utente.";
  
  var obj = {
    tipoRisultato: "text",
    text: string
  }
  result(JSON.stringify(obj));
}
