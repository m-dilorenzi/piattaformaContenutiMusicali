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

Ciascuna richiesta HTTP proveniente dal client (per testare le API è stato utilizzato il bot di Telegram _@FindYourFavouriteMusicBot_ ), verrà inoltrata al suo opportuno _endpoint_, che ricaverà i dati richiesti in formato JSON per poi impostarli come risposta della richiesta formulata dal client.

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
Ogni endpoint che gestisce una precisa richiesta restituisce strutture di tipo JSON. Al momento della formulazione della richiesta HTTP da parte del client, sarà importante specificare come parametro di _header_
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
  "resultCount":1,
  "results": [
    {
      "wrapperType":"track",
      "kind":"song",
      "artistId":252282750,
      "collectionId":1324328640,
      "trackId":1324328644,
      "artistName":"Coez",
      "collectionName":"Faccio un casino",
      "trackName":"Ciao",
      "collectionCensoredName":"Faccio un casino",
      "trackCensoredName":"Ciao",
      "artistViewUrl":"https://music.apple.com/us/artist/coez/252282750?uo=4", "collectionViewUrl":"https://music.apple.com/us/album/ciao/1324328640?i=1324328644&uo=4",
      "trackViewUrl":"https://music.apple.com/us/album/ciao/1324328640?i=1324328644&uo=4",
      "previewUrl":"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview128/v4/60/f0/1d/60f01db5-5397-7310-31c2-ee42beb3018e/mzaf_149484567351778114.plus.aac.p.m4a",
      "artworkUrl30":"https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/e6/85/4e/e6854e99-22b3-f536-9567-41ef446c6c54/source/30x30bb.jpg",
      "artworkUrl60":"https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/e6/85/4e/e6854e99-22b3-f536-9567-41ef446c6c54/source/60x60bb.jpg",
      "artworkUrl100":"https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/e6/85/4e/e6854e99-22b3-f536-9567-41ef446c6c54/source/100x100bb.jpg",
      "collectionPrice":7.99,
      "trackPrice":0.99,
      "releaseDate":"2017-05-05T07:00:00Z",
      "collectionExplicitness":"notExplicit",
      "trackExplicitness":"notExplicit",
      "discCount":1,
      "discNumber":1,
      "trackCount":12,
      "trackNumber":2,
      "trackTimeMillis":219360,
      "country":"USA",
      "currency":"USD",
      "primaryGenreName":"Pop/Rock",
      "isStreamable":true
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
 "resultCount":1,
 "results": [
    {
      "wrapperType":"artist",
      "artistType":"Artist",
      "artistName":"Coez",
      "artistLinkUrl":"https://music.apple.com/us/artist/coez/252282750?uo=4",
      "artistId":252282750,
      "amgArtistId":2835325,
      "primaryGenreName":"Pop",
      "primaryGenreId":14
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
  "kind": "youtube#videoListResponse",
  "etag": "\"8jEFfXBrqiSrcF6Ee7MQuz8XuAM/HHy2Y_QyvyZd4lsuBYF5e8l5vEw\"",
  "pageInfo": {
    "totalResults": 5,
    "resultsPerPage": 5
  },
  "items": [
    {
      "kind": "youtube#video",
      "etag": "\"8jEFfXBrqiSrcF6Ee7MQuz8XuAM/4rdgbJOEc-R_kSLmh4eLjkZi4dE\"",
      "id": "0GO0YdJvy_s",
      "snippet": {
        "publishedAt": "2018-04-10T09:00:00.000Z",
        "channelId": "UC_a9Mxea2o3ehCHzI-kjxMQ",
        "title": "Coez - Ciao",
        "description": "Ascolta lâ€™album â€œFaccio un casinoâ€ qui: https://lnk.to/Coez_FaccioUnCasino\n\nRegia di Younuts\nMontaggio di Lorenzo Catapano\nProduzione esecutiva di Coez\nTesto di Coez\nProduzione di Frenetik & Orang3\nRegistrato allo Studi8 / Lanificio159, Roma\n\nSeguimi su:\nInstagram: http://bit.ly/Coez_IG\nSpotify: http://bit.ly/Coez_SP\nFacebook: http://bit.ly/Coez_FB\n\nhttp://vevo.ly/yMcsdd",
        "thumbnails": {
          "default": {
            "url": "https://i.ytimg.com/vi/0GO0YdJvy_s/default.jpg",
            "width": 120,
            "height": 90
          },
          "medium": {
            "url": "https://i.ytimg.com/vi/0GO0YdJvy_s/mqdefault.jpg",
            "width": 320,
            "height": 180
          },
          "high": {
            "url": "https://i.ytimg.com/vi/0GO0YdJvy_s/hqdefault.jpg",
            "width": 480,
            "height": 360
          },
          "standard": {
            "url": "https://i.ytimg.com/vi/0GO0YdJvy_s/sddefault.jpg",
            "width": 640,
            "height": 480
          },
          "maxres": {
            "url": "https://i.ytimg.com/vi/0GO0YdJvy_s/maxresdefault.jpg",
            "width": 1280,
            "height": 720
          }
        },
        "channelTitle": "CoezVEVO",
        "tags": [
          "faccio un casino",
          "la musica non c'Ã¨",
          "le luci della cittÃ ",
          "e yo mamma",
          "taciturnal",
          "gemitaiz",
          "noyz narcos",
          "calcutta"
        ],
        "categoryId": "10",
        "liveBroadcastContent": "none",
        "localized": {
          "title": "Coez - Ciao",
          "description": "Ascolta lâ€™album â€œFaccio un casinoâ€ qui: https://lnk.to/Coez_FaccioUnCasino\n\nRegia di Younuts\nMontaggio di Lorenzo Catapano\nProduzione esecutiva di Coez\nTesto di Coez\nProduzione di Frenetik & Orang3\nRegistrato allo Studi8 / Lanificio159, Roma\n\nSeguimi su:\nInstagram: http://bit.ly/Coez_IG\nSpotify: http://bit.ly/Coez_SP\nFacebook: http://bit.ly/Coez_FB\n\nhttp://vevo.ly/yMcsdd"
        }
      }
    },
    {
      "kind": "youtube#video",
      "etag": "\"8jEFfXBrqiSrcF6Ee7MQuz8XuAM/g8QU7Z4a7qLFmqTaIC3rEvfCcVo\"",
      "id": "xdGGkDkkCS0",
      "snippet": {
        "publishedAt": "2017-07-02T22:05:20.000Z",
        "channelId": "UC-v9Kf6e2CQajrzGjmbAy4Q",
        "title": "Coez - Ciao",
        "description": "Ho smesso col credere ai grandi\no almeno di credere che esistano\nquando ho smesso con il crystalball\nNon do piÃ¹ peso alle parole di una rivista, oh\nUn vero artista dicono non si rattrista, no\nHo smesso con certi\ntipi di rum, non mi\nfacevano stare bene i giorni dopo i concerti\nE ho chiuso progetti,\nho smesso di avere rapporti non protetti\nda quando non sto con te\n\nCiao, ci vediamo? Come va?\nE come mai non smetto mai con te,\nsembra strano, te ne vai,\nma le tue strade portano da me, perchÃ©, perchÃ©,\ne le mie strade portano da te, perchÃ©, perchÃ©\nHo giÃ  smesso di chiedermelo\n\nHo smesso col frequentare certe sale da ballo\nSe non mi riesco ad addormentare do la colpa al caldo,\ne guardo spesso in alto, cerco di non cadere\nSono a terra e rido, ciÃ² che Ã¨ a terra ormai non puÃ² cadere\nDove andrai, dove andrÃ², e come piange il cielo oh\nsu di te, su di noi, siamo soli davvero\n\nCiao, ci vediamo? Come va?\nE come mai non smetto mai con te,\nsembra strano, te ne vai,\nma le tue strade portano da me, perchÃ©, perchÃ©,\ne le mie strade portano da te, perchÃ©, perchÃ©\nHo giÃ  smesso di chiedermelo\n\nHo smesso di lottare andare contro certi mostri\nDentro un cinema 3D con piÃ¹ di mille posti\nE ho smesso di volere donne, soldi, gloria e fama\nPerchÃ© la brama delle cose infine le allontana\n\nCiao, ci vediamo? Come va?\nE come mai non smetto mai con te,\nsembra strano, te ne vai,\nma le tue strade portano da me, perchÃ©, perchÃ©,\ne le mie strade portano da te, perchÃ©, perchÃ©\nHo giÃ  smesso di chiedermelo",
        "thumbnails": {
          "default": {
            "url": "https://i.ytimg.com/vi/xdGGkDkkCS0/default.jpg",
            "width": 120,
            "height": 90
          },
          "medium": {
            "url": "https://i.ytimg.com/vi/xdGGkDkkCS0/mqdefault.jpg",
            "width": 320,
            "height": 180
          },
          "high": {
            "url": "https://i.ytimg.com/vi/xdGGkDkkCS0/hqdefault.jpg",
            "width": 480,
            "height": 360
          },
          "standard": {
            "url": "https://i.ytimg.com/vi/xdGGkDkkCS0/sddefault.jpg",
            "width": 640,
            "height": 480
          },
          "maxres": {
            "url": "https://i.ytimg.com/vi/xdGGkDkkCS0/maxresdefault.jpg",
            "width": 1280,
            "height": 720
          }
        },
        "channelTitle": "ba rik",
        "tags": [
          "coez",
          "ciao",
          "faccio",
          "un",
          "casino",
          "faccio un casino"
        ],
        "categoryId": "10",
        "liveBroadcastContent": "none",
        "localized": {
          "title": "Coez - Ciao",
          "description": "Ho smesso col credere ai grandi\no almeno di credere che esistano\nquando ho smesso con il crystalball\nNon do piÃ¹ peso alle parole di una rivista, oh\nUn vero artista dicono non si rattrista, no\nHo smesso con certi\ntipi di rum, non mi\nfacevano stare bene i giorni dopo i concerti\nE ho chiuso progetti,\nho smesso di avere rapporti non protetti\nda quando non sto con te\n\nCiao, ci vediamo? Come va?\nE come mai non smetto mai con te,\nsembra strano, te ne vai,\nma le tue strade portano da me, perchÃ©, perchÃ©,\ne le mie strade portano da te, perchÃ©, perchÃ©\nHo giÃ  smesso di chiedermelo\n\nHo smesso col frequentare certe sale da ballo\nSe non mi riesco ad addormentare do la colpa al caldo,\ne guardo spesso in alto, cerco di non cadere\nSono a terra e rido, ciÃ² che Ã¨ a terra ormai non puÃ² cadere\nDove andrai, dove andrÃ², e come piange il cielo oh\nsu di te, su di noi, siamo soli davvero\n\nCiao, ci vediamo? Come va?\nE come mai non smetto mai con te,\nsembra strano, te ne vai,\nma le tue strade portano da me, perchÃ©, perchÃ©,\ne le mie strade portano da te, perchÃ©, perchÃ©\nHo giÃ  smesso di chiedermelo\n\nHo smesso di lottare andare contro certi mostri\nDentro un cinema 3D con piÃ¹ di mille posti\nE ho smesso di volere donne, soldi, gloria e fama\nPerchÃ© la brama delle cose infine le allontana\n\nCiao, ci vediamo? Come va?\nE come mai non smetto mai con te,\nsembra strano, te ne vai,\nma le tue strade portano da me, perchÃ©, perchÃ©,\ne le mie strade portano da te, perchÃ©, perchÃ©\nHo giÃ  smesso di chiedermelo"
        }
      }
    },
    {
      "kind": "youtube#video",
      "etag": "\"8jEFfXBrqiSrcF6Ee7MQuz8XuAM/8Xr7hIivWopDc0qJoR6pkUYiEpk\"",
      "id": "KWYEYtvy5gY",
      "snippet": {
        "publishedAt": "2016-06-30T04:44:08.000Z",
        "channelId": "UCyBt6Co1RqrSMV64FGy_i7w",
        "title": "COEZ â€“ CIAO (Inedito Live - testo)",
        "description": "Questo Ã¨ l'inedito che Coez ha cantato al Rock in Roma il 25 giugno 2016, e come ha detto lui, Ã¨ una mina! Decisamente all'altezza dei suoi pezzi precedenti, se non addirittura migliore di questi!\nSpero vi piaccia!",
        "thumbnails": {
          "default": {
            "url": "https://i.ytimg.com/vi/KWYEYtvy5gY/default.jpg",
            "width": 120,
            "height": 90
          },
          "medium": {
            "url": "https://i.ytimg.com/vi/KWYEYtvy5gY/mqdefault.jpg",
            "width": 320,
            "height": 180
          },
          "high": {
            "url": "https://i.ytimg.com/vi/KWYEYtvy5gY/hqdefault.jpg",
            "width": 480,
            "height": 360
          },
          "standard": {
            "url": "https://i.ytimg.com/vi/KWYEYtvy5gY/sddefault.jpg",
            "width": 640,
            "height": 480
          },
          "maxres": {
            "url": "https://i.ytimg.com/vi/KWYEYtvy5gY/maxresdefault.jpg",
            "width": 1280,
            "height": 720
          }
        },
        "channelTitle": "bea",
        "tags": [
        "coez",
        "ciao",
        "inedito",
        "lyrics",
        "testo",
        "coez ciao",
        "coez inedito",
        "coez live",
        "live",
        "roma",
        "capannelle",
        "giugno",
        "25 giugno",
        "rock in roma",
        "the italian way",
        "coez rock in roma",
        "2016"
      ],
      "categoryId": "22",
      "liveBroadcastContent": "none",
      "localized": {
        "title": "COEZ â€“ CIAO (Inedito Live - testo)",
        "description": "Questo Ã¨ l'inedito che Coez ha cantato al Rock in Roma il 25 giugno 2016, e come ha detto lui, Ã¨ una mina! Decisamente all'altezza dei suoi pezzi precedenti, se non addirittura migliore di questi!\nSpero vi piaccia!"
      }
    }
  },
  {
    ...
  },
  {
    ...
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
  "tracks" : {
    "href" : "https://api.spotify.com/v1/search?query=ciao+coez&type=track&market=IT&offset=0&limit=5",
    "items" : [
      {
        "album" : {
          "album_type" : "album",
          "artists" : [
            {
              "external_urls" : {
                "spotify" : "https://open.spotify.com/artist/5dXlc7MnpaTeUIsHLVe3n4"
              },
              "href" : "https://api.spotify.com/v1/artists/5dXlc7MnpaTeUIsHLVe3n4",
              "id" : "5dXlc7MnpaTeUIsHLVe3n4",
              "name" : "Coez",
              "type" : "artist",
              "uri" : "spotify:artist:5dXlc7MnpaTeUIsHLVe3n4"
            }
          ],
          "available_markets" : [ "AD", "AE", "AR", "AT", "AU", "BE", "BG", "BH", "BO", "BR", "CA", "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "DZ", "EC", "EE", "EG", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN", "HU", "ID", "IE", "IL", "IN", "IS", "IT", "JO", "JP", "KW", "LB", "LI", "LT", "LU", "LV", "MA", "MC", "MT", "MX", "MY", "NI", "NL", "NO", "NZ", "OM", "PA", "PE", "PH", "PL", "PS", "PT", "PY", "QA", "RO", "SA", "SE", "SG", "SK", "SV", "TH", "TN", "TR", "TW", "US", "UY", "VN", "ZA" ],
          "external_urls" : {
            "spotify" : "https://open.spotify.com/album/3aKazjcDl544T21siS8lDp"
          },
          "href" : "https://api.spotify.com/v1/albums/3aKazjcDl544T21siS8lDp",
          "id" : "3aKazjcDl544T21siS8lDp",
          "images" : [
            {
              "height" : 640,
              "url" : "https://i.scdn.co/image/b611ce88b3e17998893f12fa40a680d144c93e6b",
              "width" : 640
            },  
            {
              "height" : 300,
              "url" : "https://i.scdn.co/image/2a49ba6bc7ebf81bf59ce6f7b63eb52c11b3f4ac",
              "width" : 300
            },
            {
              "height" : 64,
              "url" : "https://i.scdn.co/image/4a8b528d7fe0203975ac147a47721e62c01b1482",
              "width" : 64
            }
          ],
          "name" : "Faccio un casino",
          "release_date" : "2017-05-05",
          "release_date_precision" : "day",
          "total_tracks" : 12,
          "type" : "album",
          "uri" : "spotify:album:3aKazjcDl544T21siS8lDp"
        },
        "artists" : [
          {
            "external_urls" : {
              "spotify" : "https://open.spotify.com/artist/5dXlc7MnpaTeUIsHLVe3n4"
            },
            "href" : "https://api.spotify.com/v1/artists/5dXlc7MnpaTeUIsHLVe3n4",
            "id" : "5dXlc7MnpaTeUIsHLVe3n4",
            "name" : "Coez",
            "type" : "artist",
            "uri" : "spotify:artist:5dXlc7MnpaTeUIsHLVe3n4"
          }
        ],
        "available_markets" : [ "AD", "AE", "AR", "AT", "AU", "BE", "BG", "BH", "BO", "BR", "CA", "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "DZ", "EC", "EE", "EG", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN", "HU", "ID", "IE", "IL", "IN", "IS", "IT", "JO", "JP", "KW", "LB", "LI", "LT", "LU", "LV", "MA", "MC", "MT", "MX", "MY", "NI", "NL", "NO", "NZ", "OM", "PA", "PE", "PH", "PL", "PS", "PT", "PY", "QA", "RO", "SA", "SE", "SG", "SK", "SV", "TH", "TN", "TR", "TW", "US", "UY", "VN", "ZA" ],
        "disc_number" : 1,
        "duration_ms" : 219360,
        "explicit" : false,
        "external_ids" : {
          "isrc" : "ITNTP1700004"
        },
        "external_urls" : {
          "spotify" : "https://open.spotify.com/track/3OME70nD4TS08u5XBBK44d"
        },
        "href" : "https://api.spotify.com/v1/tracks/3OME70nD4TS08u5XBBK44d",
        "id" : "3OME70nD4TS08u5XBBK44d",
        "is_local" : false,
        "name" : "Ciao",
        "popularity" : 51,
        "preview_url" : "https://p.scdn.co/mp3-preview/c89c36adeb89779a2a45d8c4bdf135acd7ef65ce?cid=feedf0f81c40480b856ccbc83cbd567d",
        "track_number" : 2,
        "type" : "track",
        "uri" : "spotify:track:3OME70nD4TS08u5XBBK44d"
      }
    ],
    "limit" : 5,
    "next" : null,
    "offset" : 0,
    "previous" : null,
    "total" : 1
  }
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
