'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
var url = require('url').URL;
var dns = require('dns');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI);
var Schema = mongoose.Schema;
var urlSchema = new Schema({
  url: String,
  short_url: Number
});
var UrlModel = mongoose.model('Url', urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.post("/api/shorturl/new", function (req, res) {
  var urlStr = req.body.url;
  var u;
  
  // Verify if urlStr is valid string url
  try {
    u = new url(urlStr);
  } catch (e) {
    res.json({error: 'Invalid URL'});
  }
  
  // Verify if URL exists
  dns.lookup(u.hostname, err => {
    if (err) res.json({error: 'Invalid URL'});
  });
  
  // Inserting the url in db
  var done = (err, count) => {
    var newUrl = new UrlModel({
      url: urlStr,
      short_url: (count + 1)
    });
    
    newUrl.save((err, data) => {
      if (err) res.json({error: err});
      res.json({
        original_url: data.url,
        short_url: data.short_url
      });
    });
  };
  
  UrlModel.find().count(done);
  
  console.log(u.hostname || u);
});

app.get('/api/shorturl/:shortUrl', (req, res) => {
  var shortUrl = req.params.shortUrl;
  
  var done = (err, data) => {
    if (err) { 
      console.log(err); 
      return;
    }
    
    if (data) {
      res.redirect(data.url);
    } else {
      console.log('Null data');
      res.json({ error: 'Invalid Url' });
    }
  };
  
  UrlModel.findOne({ short_url: shortUrl }, done);
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});