# piattaformaContenutiMusicali

RESTful API utilizzata per ricercare all'interno di varie piattaforme (iTunes, Spotify e YouTube) contenuti musicali.<br> Sviluppato per l'esame di [Piattaforme Digitali per la Gestione del Territorio](https://www.uniurb.it/insegnamenti-e-programmi/255577) da Di Lorenzi Matteo, matricola 284700, per il corrente a.a. 2018-2019.
È possibile trovare una [repository](https://github.com/m-dilorenzi/telegram-server.git) dedicata che descrive il funzionamento di un client (bot di Telegram) che utilizza le API.

## Architettura e scelte implementative
### Architettura
L'API è stata scritta ed implementata tramite il linguaggio _NodeJS_. L'intero funzionamento della API è contenuto sul file __server.js__, il quale contiene al suo interno i vari _endpoint_ con i relativi _path_ di riferimento:

```bash
app.get('/searchiTunesSong/:text', (req, res) => {
  ...
});

app.get('/searchiTunesArtist/:text', (req, res) => {
  ...
});

app.get('/searchYoutubeVideos/:text', (req, res) => {
  ...
});

app.get('/searchSongOnSpotify/:text/:token', (req, res) => {
  ...
});

app.get('/help', (req, res) => {
  ...
});

```

Ciascuna richiesta HTTP proveniente dal client (per testare le API è stato utilizzato il bot di Telegram _@FindYourFavouriteMusicBot_ ), verrà inoltrata al suo opportuno _endpoint_, che ricaverà i dati richiesti in formato JSON per poi impostarli come risposta della richiesta formulata dal client.<br>
Nel caso in cui nella richiesta HTTP da parte del client non sia specificato un corretto path tra quelli sopra elencati, la richiesta si riferirà all'endpoint base del server, cioè  _/_  , il qualè restituirà una semplice pagina in formato HTML della quale si può trovare il codice sorgente [qui](index.html).

### Scelte implementative
La principale scelta implementativa che è stata presa riguarda la gestione del token di accesso utilizzato per la ricerca di brani musicali su Spotify. <br>Tale token di accesso ha una validità molto ristretta di 3600 secondi, cioè di un'ora.

Effettuando una opportuna richiesta HTTP in POST all'url https://accounts.spotify.com/api/token, specificando i seguenti parametri,

```bash
grant_type=authorization_code
code=<code>
redirect_uri=<uri>

Esempio:
curl -H "Authorization: Basic <base64id>" -d grant_type=authorization_code -d code=<code> -d redirect_uri=<uri> https://accounts.spotify.com/api/token

// <base64id> è un codice assegnato ad un determinato progetto, creato da un determinato
// utente, che utilizza le API messe a disposizione da Spotify

// <code> è un codice alfanumerico temporaneo che ha validità unica per la richiesta
// di un token di accesso

// <uri> indica l'indirizzo del sito web in cui l'utente viene reindirizzato e dal quale
// potrà poi ricavare dalla barra degli indirizzi il codice <code> visto in precedenza
```

si ottiene come risposta un oggetto JSON del seguente tipo:

```bash
{
  "access_token": "......",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "......"
}
```

Una volta finita l'ora di validità del token, sarà necessario ottenerne uno nuovo, nascondendo tutti questi passaggi naturalmente dalla vista dell'utente, che non si deve accorgere di tali azioni.
La gestione di tale token di accesso avviene tramite due passaggi:
  1. Richiesta di prova per verificare il codice di risposta della richiesta HTTP. Nel caso in cui tale codice sia 200, il token è ancora valido, altrimenti il token è scaduto.
  2. Nel caso in cui tale token sia scaduto, si dovrà provvedere alla richiesta di un nuovo token tramite l'utilizzo del _refresh_token_ fornito.

Questa procedura impiega qualche millisecondo, in quanto nel caso pessimo, ovvero che il token sia scaduto, dovranno essere svolte due richieste HTTP, e questo potrebbe portare a tempi di attesa troppo lunghi per ottenere la risposta desiderata.

E' stato quindi scelto di lasciare la gestione del token al client. Il client, una volta recepita la volontà dell'utente di voler cercare canzoni su Spotify, inizia subito la verifica del token in modo che, nel momento in cui l'utente va a digitare i termini di ricerca (titolo, autore o album della canzone), la verifica è già conclusa e nel momento in cui avverrà la richiesta HTTP al WebService che offre le API, viene passato come parametro nel _path_ il token valido ed utilizzabile per la ricerca.

## Dati utilizzati

I dati utilizzati come risposte fornite dalle API vengono reperiti da 3 diverse piattaforme:

  1. iTunes
  2. YouTube
  3. Spotify

Tutte e tre le piattaforme mettono a dispozione degli utenti delle API con le quali intergire, che permettono di ottenere dati su brani, video, artisti, ecc.ecc.

### iTunes
Apple mette a disposizione degli utenti delle API tramite le quali, con opportune richieste HTTP, si possono effettuare ricerche all'interno dell'iTunes Store. La API che svolge questo compito è chiamata __iTunes Search Api__.
Sfruttando la API dedicata, è possibile eseguire ricerche sull'iTunes Store tramite il seguente URL
```bash
https://itunes.apple.com/search?parameterkeyvalue
```
dove al posto di _parameterkeyvalue_ verranno inseriti una serie di attributi, opportunamente separati tra loro da _'&'_, che permetteranno la ricerca di una precisa entità.
Le API sviluppate su _piattaformaContenutiMusicali_ offrono la ricerca sull'iTunes Store della pagina di un artista e di uno o più brani.

#### Dati di ritorno
Le API messe a disposizione di iTunes restituiscono come risposta alle richieste dei dati in formato [JSON](http://www.json.org/).

#### Licenze
Le API messe a disposizione da iTunes, ed in particolare la iTunes Search API che è stata utilizzata, distribuiscono dati sotto una licenza proprietaria di Apple. I dati sono accessibili a tutti, non è necessario utilizzare quindi chiavi o codici di autorizzazione, ma vengono indicate alcune condizioni di cui essere a conoscenza prima dell'utilizzo dei dati sotto i [termini di servizio legali](https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/#legal) reperibili sulla pagina esplicativa dell'API.

### YouTube
YouTube mette a disposizione delle API per la ricerca all'interno della sua piattaforma di video, canali, playlist ed eventuali commenti di un video.
Le API sviluppate su _piattaformaContenutiMusicali_ offrono la ricerca su YouTube dei primi 5 video che soddisfano i requisiti di ricerca dell'utente.

#### Dati di ritorno
Le API messe a disposizione di YouTube restituiscono come risposta alle richieste dei dati in formato [JSON](http://www.json.org/).

#### Licenze
Le API messe a disposizione da YouTube, distribuiscono dati sotto una licenza proprietaria di Google. Per accedere ai dati infatti, è necessario l'utilizzo di un _token_ di accesso (che non perde validità come quello di Spotify ma rimane valido). Per ottenere tale token, è stato necessario prima effettuare il login tramite un profilo Google (e se necessario, creare prima il profilo e poi accedervi), e poi recarsi all'indirizzo  https://console.developers.google.com/project. Il passo successivo poi è stato quello di creare un progetto dalla dashboard di Google Developer. Bisognerà specificare poi le API che utilizzerà il progetto: in questo caso le API che sono state attivate sono chiamate __YouTube Data API v3__. Una volta eseguiti questi passi, verrà generato un token di accesso per le API di YouTube che è univoco ed è valido per un solo progetto. Ulteriori informazioni sull'utilizzo dei dati offerti dalle API di YouTube si possono trovare nei [termini di servizio legali](https://developers.google.com/youtube/terms/developer-policies) reperibili sulla pagina esplicativa dell'API.


### Spotify
Spotify mette a disposizione delle API per la ricerca all'interno della sua piattaforma di brani musicali, autori, playlist e podcast.
Le API sviluppate su _piattaformaContenutiMusicali_ offrono la ricerca su Spotify dei primi 5 brani che soddisfano i requisiti di ricerca dell'utente.

#### Dati di ritorno
Le API messe a disposizione di Spotify restituiscono come risposta alle richieste dei dati in formato [JSON](http://www.json.org/).

#### Licenze
Come nei due precedenti casi, le API messe a disposizione da Spotify, distribuiscono dati sotto una licenza proprietaria. Per accedere ai dati infatti, è necessario l'utilizzo di un _token_ di accesso, che implementa un'autenticazione di tipo [_OAuth 2.0_](https://oauth.net/articles/authentication/). Tale token ha una validità di 3600 secondi, un'ora, e dovrà essere sostituito in automatico senza nessuna interazione con l'utente. La meccanica della gestione di tale token è descritta all'interno della [repository dedicata al client](https://github.com/m-dilorenzi/telegram-server.git).  Ulteriori informazioni sull'utilizzo dei dati offerti dalle API di Spotify si possono trovare nei [termini di servizio legali](https://developer.spotify.com/terms/#iii) reperibili sulla pagina esplicativa dell'API.

## Documentazione API
La specifica dell'API è stata progettata seguendo lo standard RESTful ed è inoltre conforme allo standard Open API. Si può trovare infatti nella repository, il [file](openapi.yaml) con con estensione _.yaml_ che descrive il funzionamento delle API seguendo lo standard Open API 3.0.0.
Ogni endpoint che gestisce una precisa richiesta restituisce strutture di tipo JSON, tutte della stessa struttura, così da facilitare il client al momento della formattazione del'output. Al momento della formulazione della richiesta HTTP da parte del client, sarà importante specificare come parametro di _header_
```bash
Accept: application/json
```
<br>
<table style="width:100%">
  <tr>
    <th>Endpoint</th>
    <th>Metodo</th>
    <th>Descrizione</th>
  </tr>
  <tr>
    <td>/help</td>
    <td>GET</td>
    <td>Restituisce l'elenco dei comandi disponibili per il client</td>
  </tr>
  <tr>
    <td>/searchiTunesSong/{terminiDiRicerca}</td>
    <td>GET</td>
    <td>Permette la ricerca di un brano sull'iTunes Store</td>
  </tr>
  <tr>
    <td>/searchiTunesArtist/{terminiDiRicerca}</td>
    <td>GET</td>
    <td>Permette la ricerca della pagina di un artista sull'iTunes Store</td>
  </tr>
  <tr>
    <td>/searchYoutubeVideos/{terminiDiRicerca}</td>
    <td>GET</td>
    <td>Permette la ricerca di video su Youtube</td>
  </tr>
  <tr>
    <td>bash /searchSongOnSpotify/{terminiDiRicerca}/{token}</td>
    <td>GET</td>
    <td>Permette la ricerca di brani su Spotify</td>
  </tr>
</table>
<br>

### Comando di help
__Endpoint__
```bash
/help
```
__Metodo__
```bash
GET
```
__Richiesta di esempio__
```bash
curl -X GET "https://<url>/help" -H "accept: application/json"
```
dove il parametro _url_ indicherà l'indirizzo del server che mette a disposizione le API, cioè _piattaformacontenutimusicali.herokuapp.com_.

__Codici di risposta__
<table style="width:100%">
  <tr>
    <th>Codice</th>
    <th>Descrizione</th>
  </tr>
  <tr>
    <td>200</td>
    <td>Risposta OK</td>
  </tr>
  <tr>
    <td>400</td>
    <td>Errore nella richiesta</td>
  </tr>
  <tr>
    <td>500</td>
    <td>Errore lato server</td>
  </tr>
</table>

__Esempio__
```bash
{
  "text":"Benvenuto nel bot FindYourFavouriteMusic!\nI possibili comandi sono:\n1. /searchsongbyparameter\n  Permette di ricercare una canzone o una lista di canzoni tramite parametri come nome della canzone, artista, album, ecc.ecc. La ricerca puo' essere eseguita anche tramite un insieme di termini.\n2. /getartistpagebyname\n  Permette di ricercare la pagina iTunes di un cantante (o le pagine nel caso in cui i risultati della ricerca siano piu' di uno) alla quale si potra' poi accedere successivamente tramite l'apposito link che verra' mostrato.\n3. /searchyoutubevideos\n  Mostra i primi 5 video su YouTube che soddisfano i requisiti specificati nella ricerca.\n4. /searchsongonspotify\n  Mostra al piu' 5 canzoni con il rispettivo link di Spotify che soddisfano i requisiti specificati nella ricerca dall'utente."
}
```
<br>

### Ricerca brani su iTunes
__Endpoint__
```bash
/searchiTunesSong/{terminiDiRicerca}
```
__Metodo__
```bash
GET
```
__Parametri__
```bash
terminiDiRicerca
```
_Posizione_: path <br>
Termini utilizzati per ricercare il brano su iTunes. L'utente può specificare attributi come il nome, l'autore o il titolo dell'album della canzone.

__Richiesta di esempio__
```bash
curl -X GET "https://<url>/searchiTunesSong/ciao%20coez" -H "accept: application/json"
```
dove il parametro _url_ indicherà l'indirizzo del server che mette a disposizione le API, cioè _piattaformacontenutimusicali.herokuapp.com_.

__Codici di risposta__
<table style="width:100%">
  <tr>
    <th>Codice</th>
    <th>Descrizione</th>
  </tr>
  <tr>
    <td>200</td>
    <td>Risposta OK</td>
  </tr>
  <tr>
    <td>400</td>
    <td>Errore nella richiesta</td>
  </tr>
  <tr>
    <td>500</td>
    <td>Errore lato server</td>
  </tr>
</table>

__Esempio__
```bash
{
  "tipoRisultato": "iTunesSong",
  "risultatiTotali": 1,
  "items": [
    {
      "nome": "Ciao",
      "album": "Faccio un casino",
      "autore": "Coez",
      "prezzo": 0.99,
      "link": "https://music.apple.com/us/album/ciao/1324328640?i=1324328644&uo=4"
    }
  ]
}
```
<br>

### Ricerca della pagina di un artista su iTunes
__Endpoint__
```bash
/searchiTunesArtist/{terminiDiRicerca}
```
__Metodo__
```bash
GET
```
__Parametri__
```bash
terminiDiRicerca
```
_Posizione_: path <br>
Nome dell'artista utilizzato per la ricerca della sua pagina su iTunes.

__Richiesta di esempio__
```bash
curl -X GET "https://<url>/searchiTunesArtist/coez" -H "accept: application/json"
```
dove il parametro _url_ indicherà l'indirizzo del server che mette a disposizione le API, cioè _piattaformacontenutimusicali.herokuapp.com_.

__Codici di risposta__
<table style="width:100%">
  <tr>
    <th>Codice</th>
    <th>Descrizione</th>
  </tr>
  <tr>
    <td>200</td>
    <td>Risposta OK</td>
  </tr>
  <tr>
    <td>400</td>
    <td>Errore nella richiesta</td>
  </tr>
  <tr>
    <td>500</td>
    <td>Errore lato server</td>
  </tr>
</table>

__Esempio__
```bash
{
  "tipoRisultato": "iTunesArtist",
  "risultatiTotali": 1,
  "items": [
    {
      "nome": "Vasco Rossi",
      "album": 0,
      "autore": 0,
      "prezzo": 0,
      "link": "https://music.apple.com/us/artist/vasco-rossi/14589739?uo=4"
    }
  ]
}
```
<br>

### Ricerca di video su YouTube
__Endpoint__
```bash
/searchYoutubeVideos/{terminiDiRicerca}
```
__Metodo__
```bash
GET
```
__Parametri__
```bash
terminiDiRicerca
```
_Posizione_: path <br>
Nome del video utilizzato per la ricerca su YouTube.

__Richiesta di esempio__
```bash
curl -X GET "https://<url>/searchYoutubeVideos/ciao%20coez" -H "accept: application/json"
```
dove il parametro _url_ indicherà l'indirizzo del server che mette a disposizione le API, cioè _piattaformacontenutimusicali.herokuapp.com_.

__Codici di risposta__
<table style="width:100%">
  <tr>
    <th>Codice</th>
    <th>Descrizione</th>
  </tr>
  <tr>
    <td>200</td>
    <td>Risposta OK</td>
  </tr>
  <tr>
    <td>400</td>
    <td>Errore nella richiesta</td>
  </tr>
  <tr>
    <td>500</td>
    <td>Errore lato server</td>
  </tr>
</table>

__Esempio__
```bash
{
  "tipoRisultato": "YouTubeVideo",
  "risultatiTotali": 3,
  "items": [
    {
      "nome": "Coez - Ciao",
      "album": 0,
      "autore": 0,
      "prezzo": 0,
      "link": "www.youtube.com/watch?v=0GO0YdJvy_s"
    },
    {
      "nome": "Coez - Ciao",
      "album": 0,
      "autore": 0,
      "prezzo": 0,
      "link": "www.youtube.com/watch?v=xdGGkDkkCS0"
    },
    {
      "nome": "Coez - Ciao (live)",
      "album": 0,
      "autore": 0,
      "prezzo": 0,
      "link": "www.youtube.com/watch?v=hC01zbJRT9w"
    }
  ]
}
```
<br>

### Ricerca di brani su spotify
__Endpoint__
```bash
/searchSongOnSpotify/{terminiDiRicerca}/{token}
```
__Metodo__
```bash
GET
```
__Parametri__
```bash
terminiDiRicerca
token
```
_Posizione_: path <br>
Parametri utilizzati per la ricerca su Spotify.<br>
_Posizione_: path <br>
Token utilizzato per autorizzare la ricerca su Spotify.


__Richiesta di esempio__
```bash
curl -X GET "https://<url>/searchSongOnSpotify/ciao%20coez/<token>" -H "accept: application/json"
```
dove il parametro _url_ indicherà l'indirizzo del server che mette a disposizione le API, cioè _piattaformacontenutimusicali.herokuapp.com_, e il parametro _token_ indicherà invece il codice alfanumerico ottenuto per autorizzare la ricerca su Spotify.

__Codici di risposta__
<table style="width:100%">
  <tr>
    <th>Codice</th>
    <th>Descrizione</th>
  </tr>
  <tr>
    <td>200</td>
    <td>Risposta OK</td>
  </tr>
  <tr>
    <td>400</td>
    <td>Errore nella richiesta</td>
  </tr>
  <tr>
    <td>401</td>
    <td>Token scaduto</td>
  </tr>
  <tr>
    <td>500</td>
    <td>Errore lato server</td>
  </tr>
</table>

__Esempio__
```bash
{
  "tipoRisultato": "SpotifySong",
  "risultatiTotali": 1,
  "items": [
    {
      "nome": "Ciao",
      "album": 0,
      "autore": "Coez",
      "prezzo": 0,
      "link": "https://open.spotify.com/track/3OME70nD4TS08u5XBBK44d"
    }
  ]
}
```
<br>

## Deploy del server
Il deploy del server è stato effettuato sulla piattaforma Heroku, che mette a disposizione degli utenti il servizio di _continous delivery_: una volta collegato il progetto creato su Heroku con la repository di GitHub, ogni volta che un cambiamento viene effettuato al branch master, Heroku si occupa di aggiornare la versione rilasciata del server. Sarà quindi opportuno utilizzare puntualmente GitHub, così da facilitare lo sviluppo corretto ed ordinato del software ed un'eventuale futura modifica dei servizi offerti.
Sul progetto Heroku è stata impostata inoltre una variabile di sistema globale chiamata __YOUTUBEKEY__, che contiene al suo interno chiaramente la chiave alfanumerica utilizzata per autorizzare la ricerca su YouTube. E' stata impostata come variabile d'ambiente in quanto la chiave ha validità _infinita_, e rimane quindi sempre la stessa, cosa che invece non avviene con il token di Spotify, che come già visto in precedenza ha validità di un'ora e viene gestito lato client con conseguente passaggio di parametro nella richiesta HTTP.

## Utilizzo della piattaforma
La piattaforma è tutt'ora disponibile in quanto il WebService che gestisce le richieste è collocato su Heroku ed è in esecuzione. Non occorre quindi nessuna azione da parte dell'utente per settare o impostare la piattaforma per poi usufruire dei suoi servizi.

### Interazione con la piattaforma
Per quanto riguarda l'utilizzo della piattaforma, è possibile usufruire dei suoi servizi in vari modi. Il più semplice, ma anche meno curato, è quello formato da richieste HTTP digitate direttamente sulla barra di ricerca URL di un qualsiasi browser o da un qualsiasi apposito strumento (ex. Postman). La piattaforma stamperà a video l'oggetto JSON corrispondente al risultato o l'eventuale errore sopravennuto. Un altro metodo per utilizzare la piattaforma è quello dello sviluppo di un client apposito. Durante lo sviluppo software della piattaforma, il suo corretto funzionamento è stato testato richieste formulate con Postman, per poi passare all'implementazione vera e propria tramite il bot di Telegram @FindYourFavouriteMusic, del quale è possibile trovare la documentazione al seguente [indirizzo](https://github.com/m-dilorenzi/telegram-server.git).
