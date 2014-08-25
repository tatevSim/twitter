var express = require('express');
var router = express.Router();
var request = require('request');

/* GET home page. */
router.get('/', function (req, res) {
    var db = req.app.get('db');
    var messages = db.model('Message');

    messages.find({}, function(err, doc){
        res.render('list', {docs:doc})
    })
});

router.get('/new', function(req, res) {
        var a = Math.floor(Math.random()*10);
        var b = Math.floor(Math.random()*10);

        req.session.capSum = a+b;
        res.render('tweetForm', {a:a,b:b});

  res.render('tweetForm', { message: '' });
});

router.post('/new', function(req, res) {
    if (req.body.capSum != req.session.capSum) {
        res.end('Wrong sum');
        return;
    }

    var db = req.app.get('db');
    var tweet = db.model('Message');

    analyzeMessage(req.body.tweet, db, function(data){
        tweet({body:data}).save(function(){
            res.redirect('/');
      });

    });
});

function analyzeMessage(message, db, callback){

    var words = message.split(' ');

    var i = 0;
    for (var word in words) {
        i++;
        if (words[word][0] === '#') {
            words[word] = processHashTag(words[word]);

            if(i === words.length)
                callback(words.join(' '));
        } else if (words[word].substr(0,7) === 'http://' || words[word].substr(0,8) === 'https://') {
            processUrl(words[word], db, function(data){
                words[word] = data;
                if(i === words.length)
                    callback(words.join(' '));
            });
        } else {
            if(i === words.length)
                callback(words.join(' '));
        }
    }

}

function processUrl(url ,db, callback) {
    request.get(url, function(error, response, body){
        if (!error) {
            if (response.headers['content-type'].toLowerCase().search('image') !== -1){
                callback('<img class ="tweetImage" src ="'+url+'">');
            } else {
                shortenUrl(url, db, function(data){
                    callback(data);
                });
            }
        } else {
            shortenUrl(url, db, function(data){
                callback(data);
            });
        }

    });
}

function shortenUrl(url, db, callback) {

    var newUrl = db.model('UrlShortener');

    var id = Math.random().toString(36).substring(7);

    newUrl.find({shortKey:id},function(err, result) {
        if (result.length === 0) {
            newUrl({shortKey:id, url:url}).save(function(){
                callback('<a href="/s/'+id+'">'+'http://localhost:3000/s/'+id+'</a>');
            })
        } else {
            shortenUrl(url);
        }
    });
}

function processHashTag(hashTag) {
    return '<a href="/t/'+hashTag.slice(1)+'">'+hashTag+'</a>';
}

router.get('/t/:tag', function (req, res) {
    var db = req.app.get('db');
    var twitts = db.model('Message');
    var query = new RegExp('#'+req.params.tag);
    twitts.find({body:query}, function(err, doc){
        res.render('list', {docs:doc})
    })
});

router.get('/s/:url', function (req, res) {
    var db = req.app.get('db');
    var ur = db.model('UrlShortener');
    var url = req.params.url;
    ur.find({shortKey:url}, function(err, doc){
        res.redirect(doc[0].url)
    })
});

module.exports = router;
