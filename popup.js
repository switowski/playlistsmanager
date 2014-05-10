// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Global variable containing the query we'd like to pass to Flickr. In this
 * case, kittens!
 *
 * @type {string}
 */
'use strict';

var QUERY = 'kittens';

var kittenGenerator = {
  /**
   * Flickr URL that will give us lots and lots of whatever we're looking for.
   *
   * See http://www.flickr.com/services/api/flickr.photos.search.html for
   * details about the construction of this URL.
   *
   * @type {string}
   * @private
   */
  searchOnFlickr_: 'https://secure.flickr.com/services/rest/?' +
      'method=flickr.photos.search&' +
      'api_key=90485e931f687a9b9c2a66bf58a3861a&' +
      'text=' + encodeURIComponent(QUERY) + '&' +
      'safe_search=1&' +
      'content_type=1&' +
      'sort=interestingness-desc&' +
      'per_page=20',

  /**
   * Sends an XHR GET request to grab photos of lots and lots of kittens. The
   * XHR's 'onload' event is hooks up to the 'showPhotos_' method.
   *
   * @public
   */
  requestKittens: function() {
    var req = new XMLHttpRequest();
    req.open('GET', this.searchOnFlickr_, true);
    req.onload = this.showPhotos_.bind(this);
    req.send(null);
  },

  /**
   * Handle the 'onload' event of our kitten XHR request, generated in
   * 'requestKittens', by generating 'img' elements, and stuffing them into
   * the document for display.
   *
   * @param {ProgressEvent} e The XHR ProgressEvent.
   * @private
   */
  showPhotos_: function (e) {
    var kittens = e.target.responseXML.querySelectorAll('photo');
    for (var i = 0; i < kittens.length; i++) {
      var img = document.createElement('img');
      img.src = this.constructKittenURL_(kittens[i]);
      img.setAttribute('alt', kittens[i].getAttribute('title'));
      document.body.appendChild(img);
    }
  },

  /**
   * Given a photo, construct a URL using the method outlined at
   * http://www.flickr.com/services/api/misc.urlKittenl
   *
   * @param {DOMElement} A kitten.
   * @return {string} The kitten's URL.
   * @private
   */
  constructKittenURL_: function (photo) {
    return 'http://farm' + photo.getAttribute('farm') +
        '.static.flickr.com/' + photo.getAttribute('server') +
        '/' + photo.getAttribute('id') +
        '_' + photo.getAttribute('secret') +
        '_s.jpg';
  }
};


var playlistManager = {
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
      alert('I am happy');s
      console.log(activeUrl);
      console.log('Grooveshark website !');
    } /*else if (activeUrl.indexOf('deezer') > -1) {
      document.getElementById('info').innerHTML = 'DEEZER'
      // We are on Deezer website
    }*/ else if ((activeUrl.indexOf('deezer') > -1) && (activeUrl.indexOf('/playlist/') > -1)) {
      var playlist_id = activeUrl.split('/');
      playlist_id = playlist_id[playlist_id.length - 1];
      var url = 'http://api.deezer.com/playlist/' + playlist_id;
      $.get(
          url,
          {},
          function(data) {
            var name = data['title'];
            var tracks = data['tracks']['data'];
            console.log(tracks)
            var songs = [];
            for (var track in tracks){
                track = tracks[track]
                console.log(track['title']);
                var song = {    title: track['title'],
                                artist: track['artist']['name'],
                                album: track['album']['title']
                            };
                console.log(song.title); 
                songs.push(song);
            }
            var text = "{  \"playlistName\":\"" + name + "\",\n";
            text += "\"playlistSongs\":[\n"
            for (var song in songs){
                song = songs[song]
                text += "{\"title\":\"" + song.title + "\", \"artist\":\"" + song.artist + "\", \"album\":\"" + song.album + "\"},\n";
            }
            text = text.substring(0, text.length - 2)
            text += "\n]\n}"
            alert(text);
          }

      );
      // We are on Spotify website
    } else {
      // We are on different website, we can't perform anything here
      alert('Sorry but this page is unsupported yet. Our programmers are working day and night so you will be able to export music from ' + activeUrl + ' in the nearest future.');
      // TODO replace this stupid alert with HTML added to extension bubble that is displayed for 10 seconds and disappears later
    }
  });

  },

  parseGrooveshark: function () {
  // parse the HTML, grab all metadata about songs and create XML files
  $('.module-row').filter('.song');
  }
};


// Run the script when the document's DOM is ready.
document.addEventListener('DOMContentLoaded', function () {
  playlistManager.createInterface();
});


chrome.extension.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {
    var HTMLPage = request.source;
    // HTML received, run functions
    
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
      console.log(chrome.extension.lastError);
    }
  });

}

window.onload = onWindowLoad;