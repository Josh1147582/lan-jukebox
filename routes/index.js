module.exports = function (io) {
    var app = require('express')();

    // Body parsing
    var bodyParser = require('body-parser');
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());

    // Validation
    var expressValidator = require('express-validator');
    app.use(expressValidator());

    // Child process, for spawning youtube-dl
    var child_process = require('child_process');

    // The location of the youtube-dl executable
    var YOUTUBE_DL_LOC = '/usr/bin/youtube-dl'

    // Keep track of music to play, playing, and played
    var playlist = [];
    var playing = 'None';
    var played = [];

    var Player = require('player');

    io.on('connection', function (socket) {
	console.log('a user connected');
    });

    // Create a player with the proper error handling.
    function playerCreator(song) {
	if (song)
	    return new Player(song)
	    .on('error', function(err) {playerHandleError(playlist, played)})
	return new Player()
	    .on('error', function(err) {playerHandleError(playlist, played)})
    }

    player = playerCreator();

    // Player functionality

    // Songs move from playlist (if nothing is playing presently), to playing, to played.

    // TODO check if song already exists in played.

    // event: on error (No next song was found).
    function playerHandleError(playlist, played) {

	// TODO Workaround for a bug in player: wait a couple seconds so the
	// songs don't overlap.
	
	// Move the recently playing song to played.
	played.push(playing);

	if (playlist.length != 0) {
	    // Play the next song.
	    player = playerCreator(playlist[0]);
	    player.play();

	    // Remove the added song.
	    playing = playlist[0];
	    playlist.shift();
	} else {
	    // Reset the object, resetting its playlist.
	    player = playerCreator();
	    playing = 'None';
	}
    }

    // Add a song and start the playlist, if it's empty.
    function playerAddSong(song) {
	if (player.list.length == 0) {
	    // If this is the player's first song, start it.
	    player = playerCreator(song);
	    player.play();
	    playing = song;
	} else { 
	    // Otherwise add it to the queue
	    playlist.push(song);
	}

    }


    /* GET home page. */
    app.get('/', function(req, res, next) {

	var playlist_view;
	if(playlist.length) {
	    playlist_view = '<p>Playlist:</p><ul>';
	    for(var i=0; i < playlist.length; i++) {
		playlist_view +=
		    '<li>' +
		    playlist[i].replace(/^\.\/downloads\//, '') .replace(/\.mp3$/, '') +
		    '</li>';
	    }
	    playlist_view += '</ul>';
	} else {
	    playlist_view = '<p>No songs in playlist.</p>';
	}
	var playing_view = '<p>Now playing: ' + playing.replace(/^\.\/downloads\//, '') .replace(/\.mp3$/, '') + '</p>';
	var played_view;
	if(played.length) {
	    played_view = '<p>Played:</p><ul>';
	    for(var i=0; i < played.length; i++) {
		played_view +=
		    '<li>' +
		    played[i].replace(/^\.\/downloads\//, '') .replace(/\.mp3$/, '') +
		    '</li>';
	    }
	    played_view += '</ul>';
	} else {
	    played_view = '<p>No played songs.</p>';
	}
	res.render('index', { playlist_view: playlist_view,
			      playing_view: playing_view,
			      played_view: played_view });
    });

    app.get('/youtube', function(req, res, next) {
	res.render('youtube');
    });

    app.use(expressValidator({
	customValidators: {
	    dlSuccess: function(video) {
		// Test if the requested video is available.
		// TODO make this non-blocking so music doesn't stop
		var youtube_dl = child_process.spawnSync(YOUTUBE_DL_LOC, ['-s', video]);

		// DEBUG: for when I forget to change the var
		if(youtube_dl.stderr == null) {
		    console.log("Your youtube-dl location is probably invalid.");
		}

		if (youtube_dl.stderr.toString()) {
		    return false;
		}
		return true;
	    }
	}
    }
			    ));

    app.post('/youtube', function(req, res) {
	var video = req.body.video;
	
	req.checkBody('video', 'URL is not valid.').dlSuccess();
	
	var errors = req.validationErrors();
	
	if(errors){
	    res.render('youtube', {
		errors:errors
	    });
	} else {
	    var youtube_dl = child_process.spawn(YOUTUBE_DL_LOC, ['-x', '--audio-format', 'mp3', '-o', 'downloads/%(title)s.%(ext)s', video]);
	    youtube_dl.on('close', (code) => {
		console.log("Done getting " + video);
		var error;
		youtube_dl.stderr.on('data', (data) => {
		    error = data;
		    console.log(`Error getting video: ${data}`);
		    // TODO give error to user when they return to /
		});

		if(!error) {
		    var youtube_dl_get_title = child_process.spawnSync(YOUTUBE_DL_LOC, ['--get-title', video]);
		    console.log(youtube_dl_get_title.stdout.toString());
		    playerAddSong('./downloads/' + youtube_dl_get_title.stdout.toString()
				  .replace('\n', '')
				  .replace(new RegExp('"', 'g'), '\'')
				  + ".mp3");
		}
		res.redirect('/');
	    });
	}
    });

    app.get('/file', function(req, res, next) {
	res.render('file');
    });

    // Return the router.
    return app;

    // module.exports = app;

};
