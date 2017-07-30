var Player = require('player');
var player = new Player();

playerAddSong('./downloads/\'IS THAT A MAN RIDING A SHRIMP\'.mp3');

// event: on error (No next song was found)
player.on('error', function(err){
  // Reset the object, resetting the playlist.
  player = new Player();
});

// Add a song and start the playlist, if it's empty
function playerAddSong(song) {
    player.add(song);
  if (player.list.length == 1) {
    player.play();
  }
}
