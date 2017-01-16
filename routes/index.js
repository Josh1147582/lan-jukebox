var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());
router.use(expressValidator());

var child_process = require('child_process');

var Player = require('player');

/* Example player code
var player = new Player('./downloads/Doodlebob - Bring Me to Life.mp3');
// play now and callback when playend 
player.play(function(err, player){
    console.log('playend!');
});
player.play();
*/

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/youtube', function(req, res, next) {
  res.render('youtube');
});

router.use(expressValidator({
    customValidators: {
	dlSuccess: function(video) {
	    // Test if the requested video is available.
	    var youtube_dl = child_process.spawnSync('/usr/bin/youtube-dl', ['-s', video]);
	    console.log(youtube_dl.stderr.toString());
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
	var youtube_dl = child_process.spawn('/usr/bin/youtube-dl', ['-x', '--audio-format', 'mp3', '-o', 'downloads/%(title)s.%(ext)s', video]);
	// TODO eval video
	res.render('index');
    }
});

router.get('/file', function(req, res, next) {
  res.render('file');
});

module.exports = router;
