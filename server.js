/**
		 *	File 			Server.js
		 * 	@version 		0.0.1
		 * 	@author 		Gaurav Kumar		<gauravbansal74@gmail.com>
*/	

//import configuration
var config = require('./config/config');

//webSocketServer using Node Package i.e. websocket.( For more please check package.json)
var webSocketServer = require("websocket").server;

//reference of "http" default Node Package 
var httpServer = require("http");

//Redis package reference 
var redis = require("redis");

//URL Parser
var url = require('url');

//All DB operations are in this file
var lib = require('./lib');

//All server configurations are in this file
var mysql = require("./config/db");

//create redis clients for PUB and SUB
const subscribe = redis.createClient();
const publish = redis.createClient();
const allApiKey = [];


//create http server using httpServer Reference
var hServer = httpServer.createServer(function(request, response){
	// Not important for us. We're writing WebSocket server, not HTTP server
});

//assign the port to the server
hServer.listen(config.port, function(){
	console.log((new Date())+" Server is listening on port "+config.port);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
	 // WebSocket server is tied to a HTTP server. WebSocket request is just
	 // an enhanced HTTP request.
	httpServer : hServer
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on("request", function(request){

	//Get the API key from the URL
	var url_parts = url.parse(request.resource, true);
	var query = url_parts.query;
	//User API Key
	var apiKey = query['key'];

	allApiKey.push(apiKey);

	// accept connection - we should check 'request.origin' to make sure that
    // client is connecting from our clients
	var connection = request.accept(null,request.origin);

	subscribe.subscribe(apiKey);
		
	//Redis Subscribe
	subscribe.on('subscribe', function(channel, count){
		//console.log("subscribe for "+channel+ " and count is "+count);
	});


	//Redis Publish Event
	subscribe.on("message", function(channel, message) {
		connection.send(message);
	});

	//Web Socket onMessage	
	connection.on('message', function(message){ 
		if(message.type ==='utf8'){
			for (var i =0; i < allApiKey.length; i++) {
			  var channel = allApiKey[i];
			  publish.publish(channel, JSON.stringify(message.utf8Data));
			};
				
		}else{
			console.log("Not UTF msg");
		}
	});

	
	connection.on("close", function(connection){
	});
	 
});



