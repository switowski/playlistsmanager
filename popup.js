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

var access_token = 'frClViuuja536f5e4c0ff7bvqcYSvVH536f5e4c0ffb3YgdcEZs'
var user_id = '393724495'

function save_to_file(text) {
     var dataURL = 'data:text/json;charset=utf-8,' + escape(text)
     var zipName = 'playlist.json'
     chrome.downloads.download({
            url:      dataURL,
            filename: zipName,
            saveAs:   true
        });
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
    var upload =  document.createElement('button');
    upload.textContent = 'Import to Deezer';
    upload.onclick = this.import_to_Deezer;
    document.body.appendChild(upload);
  },

  exportPlaylist: function () {
    // Function that is called when 'Export playlist' button is clicked
    chrome.tabs.query({active: true, currentWindow: true}, function(tab) {
      // this functions is async so call other functions based on the url here, not outside of this function
      var activeUrl = tab[0].url;
      if ((activeUrl.indexOf('grooveshark') > -1) && (activeUrl.indexOf('/playlist/') > -1)) {
            // We are on Grooveshark website with a playlist
            console.log('Grooveshark website !');
            playlistManager.parseGrooveshark(activeUrl);
      } else if ((activeUrl.indexOf('deezer') > -1) && (activeUrl.indexOf('/playlist/') > -1)) {
            var playlist_id = activeUrl.split('/');
            playlist_id = playlist_id[playlist_id.length - 1];
            var url = 'http://api.deezer.com/playlist/' + playlist_id;
            $.get(url,
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
                  });
    } else if (activeUrl.indexOf('spotify') > -1) {
      // We are on Spotify website
    } else {
      // We are on different website, we can't perform anything here
      alert('Sorry but this page is unsupported yet. Our programmers are working day and night so you will be able to export music from ' + activeUrl + ' in the nearest future.');
      // TODO replace this stupid alert with HTML added to extension bubble that is displayed for 10 seconds and disappears later
    }
  });
  },

  from_Grooveshark_to_Deezer: function(){
    // parse the HTML, grab all metadata about songs and create XML files
    var $HTMLPage = $.parseHTML(this.HTMLPage);
    // Get the playlist name
    var playlistName = $('#playlist-title', $HTMLPage).text();
    // Sometimes the HTML loads slowly (it's asynchronous, so even window.onload doesn't help),
    // so if we run the plugin too fast, the playlist will be empty. In that case let's wait a moment and call this function again.
    if (! $(".module-row-header", $HTMLPage).length) {
      // Wait a moment
      window.setTimeout(function() {
        // Reload the HTML
        onWindowLoad();
        // Re-parse the Grooveshark data
        playlistManager.from_Grooveshark_to_Deezer();
      }, 1000);
    } else {
        $.post('http://api.deezer.com/user/' + user_id + '/playlists',
            {'title': playlistName, 'access_token': access_token},
            function(id){
                var arraySongs = $('.module-row', $HTMLPage).filter('.song');
                var div = document.createElement('div');
                div.textContent = 'Import completed!';
                document.body.appendChild(div);
                $.each(arraySongs, function(index, value) {
                    var songJSON = new Object();
                    var title = $('.song span', value).text();
                    var artist = $('.artist a', value).text();
                    var album = $('.album a', value).text();
                    var query = title
                    console.log('QUERY    ' + query)
                    $.get('http://api.deezer.com/search?q=' + query + '&order=RANKING_DESC',
                        {},
                        function(result, title, album, artist){
                            var data = result['data'];
                            if (data.length > 0){
                                var songid = '';
                                for (var s in data){
                                    var tit = data[s]['title'];
                                    if (tit == title){
                                        songid = data[s]['id'];
                                        break;
                                    }
                                }
                                if (songid == ''){
                                    songid = data[0]['id'];
                                }
                                console.log(songid)
                                console.log('http://api.deezer.com/playlist/' + id['id'] + '/tracks')
                                $.post('http://api.deezer.com/playlist/' + id['id'] + '/tracks',
                                    {'access_token': access_token, 'songs': songid},
                                    function(addsong){
                                        console.log(addsong)
                                    });
                            }
                            console.log(result);
                        });
                });
        });
    }
  },

  import_to_Deezer: function(){
     onWindowLoad();
     chrome.tabs.query({active: true, currentWindow: true}, function(tab) {
        // this functions is async so call other functions based on the url here, not outside of this function
        var url = tab[0].url;
        console.log(url)
        if ((url.indexOf('grooveshark') > -1) && (url.indexOf('/playlist/') > -1)) {
            playlistManager.from_Grooveshark_to_Deezer();            
        } else if ((url.indexOf('deezer') > -1) && (url.indexOf('/playlist/') > -1)) {
            var playlist_id = url.split('/');
            playlist_id = playlist_id[playlist_id.length - 1];
            url = 'http://api.deezer.com/playlist/' + playlist_id;
            $.get(url,
                {},
                function(data) {
                    var name = data['title'];
                    $.post('http://api.deezer.com/user/' + user_id + '/playlists',
                        {'title': name, 'access_token': access_token},
                        function(id){
                            var div = document.createElement('div');
                                div.textContent = 'Import completed!';
                                document.body.appendChild(div);                                
                            var tracks = data['tracks']['data'];
                            var songs = [];
                            for (var track in tracks){
                                track = tracks[track];
                                var songid = track['id'];
                                 $.post('http://api.deezer.com/playlist/' + id['id'] + '/tracks',
                                    {'access_token': access_token, 'songs': songid},
                                    function(addsong){
                                        console.log(addsong)
                                    });
                            }
                        }
                    );
                }
            );
        } else {
             alert('Sorry but this page is unsupported yet. Our programmers are working day and night so you will be able to export music from ' + url + ' in the nearest future.');
        }
    });
  },

  parseGrooveshark: function (url) {
    var playlistJSON = new Object();

    // parse the HTML, grab all metadata about songs and create XML files
    var $HTMLPage = $.parseHTML(this.HTMLPage);

    // Get the playlist name and URL
    playlistJSON.playlistName = $('#playlist-title', $HTMLPage).text();
    playlistJSON.playlistURL = url;

    // Sometimes the HTML loads slowly (it's asynchronous, so even window.onload doesn't help),
    // so if we run the plugin too fast, the playlist will be empty. In that case let's wait a moment and call this function again.
    if (! $(".module-row-header", $HTMLPage).length) {
      // Wait a moment
      window.setTimeout(function() {
        // Reload the HTML
        onWindowLoad();
        // Re-parse the Grooveshark data
        playlistManager.parseGrooveshark(url);
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
      save_to_file(JSON.stringify(playlistJSON));
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
