// Copyright (c) 2014 Sebastian Witowski and Giorgos Papoutsakis
'use strict';

/*
Structure of export JSON:
{
playlistName: "Some name",
playlistURL: "http://www.playlist.com/123123",
playlistSongs: [{title: "song title", artist: "artist name", album: "album name"},
                 {title: "song title", artist: "artist name", album: "album name"}, ...]
}
*/

function save_to_file(text) {
    window.open('data:text/csv;charset=utf-8,' + escape(text));
}


var playlistManager = {
  // variable to store HTML source page
  HTMLPage: "",

  // Create interface
  createInterface: function(){
    // The box is made by popup.html, we just need to create buttons here
    var btn = document.createElement('button');
    btn.textContent = 'Export playlist';
    btn.onclick = this.exportPlaylist;
    // var btn2 = $('<button>Import playlist</button>');
    document.body.appendChild(btn);
    var playlist = document.createElement('input');
    playlist.id = 'playlist'
    playlist.type = 'text';
    playlist.value = 'insert a url to a playlist'
    playlist.onclick = function(){
        if (this.value == 'insert a url to a playlist'){
            this.value = ''
        }
    }
    var upload =  document.createElement('button');
    upload.textContent = 'Import to Deezer';
    upload.onclick = this.import_to_Deezer;
    document.body.appendChild(playlist);
    document.body.appendChild(upload);
   /* var form = document.createElement('form');
    form.action = this.import_to_Deezer
    var file = document.createElement('input');
    file.type = 'file'
    var submit = document.createElement('input');
    submit.type = 'submit'
    form.appendChild(file)
    form.appendChild(submit)
    document.body.appendChild(form);*/
  

    /*importbtn.type = 'button'
    importbtn.value = 'Import to Deezer'
    importbtn.id = 'upload'
    importbtn.onclick = this.import_to_Deezer
    document.body.appendChild(importbtn)*/
  },

  exportPlaylist: function () {
    // Function that is called when 'Export playlist' button is clicked
    chrome.tabs.query({active: true, currentWindow: true}, function(tab) {
      // this functions is async so call other functions based on the url here, not outside of this function
      var activeUrl = tab[0].url;
      if ((activeUrl.indexOf('grooveshark') > -1) && (activeUrl.indexOf('/playlist/') > -1)) {
        // We are on Grooveshark website with a playlist
        console.log('Grooveshark website !');
        var GrooversharkJSON = playlistManager.parseGrooveshark(activeUrl);
      } else if ((activeUrl.indexOf('deezer') > -1) && (activeUrl.indexOf('/playlist/') > -1)) {
        var playlist_id = activeUrl.split('/');
        playlist_id = playlist_id[playlist_id.length - 1];
        var url = 'http://api.deezer.com/playlist/' + playlist_id;
        $.get(
            url,
            {},
            function(data) {
              var name = data['title'];
              var tracks = data['tracks']['data'];
              var songs = [];
              for (var track in tracks){
                  track = tracks[track]
                  var song = {    title: track['title'],
                                  artist: track['artist']['name'],
                                  album: track['album']['title']
                              };
                  songs.push(song);
              }
              var text = "{  \"playlistName\":\"" + name + "\",\n";
              text += "\t\"playlistSongs\":[\n"
              for (var song in songs){
                  song = songs[song]
                  text += "\t\t{\"title\":\"" + song.title + "\", \"artist\":\"" + song.artist + "\", \"album\":\"" + song.album + "\"},\n";
              }
              text = text.substring(0, text.length - 2)
              text += "\n\t]\n}"
              save_to_file(text)
            }

        );
      } else if (activeUrl.indexOf('spotify') > -1) {
          // We are on Spotify website
          console.log('Spotify website !');
          var SpotifyJSON = playlistManager.parseSpotify();
      } else {
        // We are on different website, we can't perform anything here
        alert('Sorry but this page is unsupported yet. Our programmers are working day and night so you will be able to export music from ' + activeUrl + ' in the nearest future.');
        // TODO replace this stupid alert with HTML added to extension bubble that is displayed for 10 seconds and disappears later
      }
    });
  },

  import_to_Deezer: function(){
    var url = document.getElementById('playlist').value
    if (url != 'insert a url to a playlist'){
        alert(url)
        $.get(
          url,
          {},
          function(data) {
            alert(data)
          });
    }
  },

  parseGrooveshark: function (activeUrl) {
    var playlistJSON = new Object();

    // parse the HTML, grab all metadata about songs and create XML files
    var $HTMLPage = $.parseHTML(this.HTMLPage);

    // Get the playlist name and URL
    playlistJSON.playlistName = $('#playlist-title', $HTMLPage).text();
    playlistJSON.playlistURL = activeUrl;

    // Sometimes the HTML loads slowly (it's asynchronous, so even window.onload doesn't help),
    // so if we run the plugin too fast, the playlist will be empty. In that case let's wait a moment and call this function again.
    if (! $(".module-row-header", $HTMLPage).length) {
      // Wait a moment
      window.setTimeout(function() {
        // Reload the HTML
        onWindowLoad();
        // Re-parse the Grooveshark data
        playlistManager.parseGrooveshark(activeUrl);
      }, 1000);
    } else {

      playlistJSON.playlistSongs = []

      var arraySongs = $('.module-row', $HTMLPage).filter('.song');
      $.each(arraySongs, function(index, value) {
        var songJSON = new Object();
        songJSON.title = $('.song span', value).text();
        songJSON.artist = $('.artist a', value).text();
        songJSON.album = $('.album a', value).text();
        playlistJSON.playlistSongs.push(songJSON);
      });
      console.log(JSON.stringify(playlistJSON));

      return JSON.stringify(playlistJSON);
    }
  }
};


chrome.extension.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {
    playlistManager.HTMLPage = request.source;
  }
});

function onWindowLoad() {

  var message = document.querySelector('#message');

  chrome.tabs.executeScript(null, {
    file: "getPagesSource.js"
  }, function() {
    // If you try and inject into an extensions page or the webstore/NTP you'll get an error
    if (chrome.extension.lastError) {
      // TODO There was an error, the HTML source was not received, do something !
      console.log("There was an error retrieving HTML source");
    }
  });

}

window.onload = function () {
  onWindowLoad;
  playlistManager.createInterface();
}
