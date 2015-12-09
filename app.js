var express = require('express'),
  app = express(),
  bluemix = require('./config/bluemix'),
  watson = require('watson-developer-cloud'),
  extend = require('util')._extend;

//avoid "request too large" exception
var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

// Bootstrap application settings
require('./config/express')(app);

// if bluemix credentials exists, then override local
var credentials = extend({
  version: 'v1',
  username: '<username>',
  password: '<password>'
}, bluemix.getServiceCreds('tradeoff_analytics')); // VCAP_SERVICES

// Create the service wrapper
var tradeoffAnalytics = watson.tradeoff_analytics(credentials);

// render index page
app.get('/', function(req, res) {
  res.render('index');
});

app.post('/dilemmas/', function(req, res) {
  var params = extend(req.body);
  params.metadata_header = getMetadata(req);
  
  tradeoffAnalytics.dilemmas(params, function(err, dilemma) {
    if (err) 
      return res.status(Number(err.code) || 502).send(err.error || err.message || 'Error processing the request');
    else
      return res.json(dilemma);
  });
});

app.post('/events/', function(req, res) {
  var params = extend(req.body);
  params.metadata_header = getMetadata(req);
  
  tradeoffAnalytics.events(params, function(err) {
    if (err)
      return res.status(Number(err.code) || 502).send(err.error || err.message || 'Error forwarding events');
    else
      return res.send();
  });
});

function getMetadata(req) {
  var metadata = req.header('x-watson-metadata');
  if (metadata) {
    metadata += "client-ip:" + req.ip;
  }
  return metadata;
}

var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);