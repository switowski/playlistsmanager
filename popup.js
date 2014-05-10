// Copyright (c) 2014 Sebastian Witowski and Giorgos Papoutsakis
'use strict';

/*
Structure of export JSON:
{
playlistName: "Some name",
playlistSongs: [{title: "song title", artist: "artist name", album: "album name"},
                 {title: "song title", artist: "artist name", album: "album name"}, ...]
}
*/

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
  },

  exportPlaylist: function () {
    // Function that is called when 'Export playlist' button is clicked
    chrome.tabs.query({active: true, currentWindow: true}, function(tab) {
    // this functions is async so call other functions based on the url here, not outside of this function
    var activeUrl = tab[0].url;
    if ((activeUrl.indexOf('grooveshark') > -1) && (activeUrl.indexOf('/playlist/') > -1)) {
      // We are on Grooveshark website with a playlist
      console.log('Grooveshark website !');
      playlistManager.parseGrooveshark();
    } else if (activeUrl.indexOf('deezer') > -1) {
      // We are on Deezer website
    } else if (activeUrl.indexOf('spotify') > -1) {
      // We are on Spotify website
    } else {
      // We are on different website, we can't perform anything here
      alert('Sorry but this page is unsupported yet. Our programmers are working day and night so you will be able to export music from ' + activeUrl + ' in the nearest future.');
      // TODO replace this stupid alert with HTML added to extension bubble that is displayed for 10 seconds and disappears later
    }
  });

  },

  parseGrooveshark: function () {
    var playlistJSON = new Object();

    // parse the HTML, grab all metadata about songs and create XML files
    var $HTMLPage = $.parseHTML(this.HTMLPage);
    console.log($HTMLPage);

    // Get the playlist name
    playlistJSON.playlistName = $('#playlist-title', $HTMLPage);
    playlistJSON.playlistSongs = []

    var arraySongs = $('.module-row', $HTMLPage).filter('.song');
    console.log(arraySongs);
    $.each(arraySongs, function(index, value) {
      var songJSON = new Object();
      console.log($('.song span', value).text());
      songJSON.title = $('.song span', value).text();
      songJSON.artist = $('.artist a', value).text();
      songJSON.album = $('.album a', value).text();
      playlistJSON.playlistSongs.push(songJSON);
    });
    console.log(playlistJSON);
  }
};


chrome.extension.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {
    playlistManager.HTMLPage = request.source;
    // HTML received, run functions
    playlistManager.createInterface();
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

window.onload = onWindowLoad;