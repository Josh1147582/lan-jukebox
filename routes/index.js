var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());
router.use(expressValidator());

var child_process = require('child_process');

var Player = require('player');
var player = new Player();

var YOUTUBE_DL_LOC = '/usr/local/bin/youtube-dl'

/* GET home page. */
router.get('/', function(req, res, next) {
    var playlist;
    if(player.list.length) {
	playlist = '<ul>';
	for(var i=0; i < player.list.length; i++) {
	    playlist +=
		'<li>' +
		player.list[i].replace(/^\.\/downloads\//, '') .replace(/\.mp3$/, '') +
		'</li>';
	}
	playlist += '</ul>';
    } else {
	playlist = '<p>No songs in playlist.</p>';
    }
    res.render('index', { playlist: playlist });
});

router.get('/youtube', function(req, res, next) {
  res.render('youtube');
});

router.use(expressValidator({
    customValidators: {
	dlSuccess: function(video) {
	    // Test if the requested video is available.
	    var youtube_dl = child_process.spawnSync(YOUTUBE_DL_LOC, ['-s', video]);
	    if (youtube_dl.stderr.toString()) {
		return false;
	    }
	    return true;
	}
    }
 }
));

router.post('/youtube', function(req, res) {
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
                player.add('./downloads/' + youtube_dl_get_title.stdout.toString().replace('\n', '') + ".mp3");
            }
            res.redirect('/');
        });
    }
});

router.get('/file', function(req, res, next) {
  res.render('file');
});

module.exports = router;
