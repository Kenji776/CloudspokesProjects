var express = require('express');
var nforce = require('nforce');
var app = express.createServer() , io = require('socket.io').listen(app);

var port = process.env.PORT || 3000;
//configure static content route blah
app.configure(function(){
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
  app.use(express.errorHandler({
    dumpExceptions: true, 
    showStack: true
  }));
  app.use(app.router);
});

app.listen(port, function() {
  console.log('Listening on ' + port);
});

io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

var oauth;

var org = nforce.createConnection({
	  clientId: '3MVG9lKcPoNINVBIesEbo7Ou4Uf4IT.ZHxm0D3hrxQnJU.vO76kdWjAWE6cvmHZkPO3xEOJu7r616v9TWEFuH',
	  clientSecret: '5601209627666273399',
	  redirectUri: 'http://localhost:' + port + '/oauth/_callback',
	  apiVersion: 'v24.0',  // optional, defaults to v24.0
	  environment: 'production'  // optional, sandbox or production, production default
});

app.post('/', function(request, response){

    var reqBody = request.body.signed_request;   
    var requestSegments = reqBody.split('.');    
    var requestContext = JSON.parse(new Buffer(requestSegments[1], 'base64').toString('ascii'));
    
    oauth = new Object();
    oauth.access_token = requestContext.oauthToken;
    oauth.instance_url = requestContext.instanceUrl;
    
    response.sendfile('index.html');

});


io.sockets.on('connection', function (socket) {
	
	try
	{
	  var str = org.stream('NewContacts', oauth);
	
	  str.on('connect', function(){
		console.log('connected to pushtopic');
	  });
	
	  str.on('error', function(error) {
		 socket.emit(error);
	  });
	
	  str.on('data', function(data) {
		 socket.emit('news', data);
	  });
	}
	catch(ex)
	{
		console.log(ex);
	}
	
});

