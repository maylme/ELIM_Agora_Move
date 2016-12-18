var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");

var uri = "mongodb://localhost:27017/elim";


var initial_datas=[
	{
		time:"2016-12-18T12:52:46+00:00",
		position: {
			latitude:"3",
			longitude: "43"
		}
	}
];

app.use(bodyParser.json());

var test = {
	data: "Coucou mon coeur!!! ça marche:!!!! je t'aime"
};

var datas = [];
app.get('/test', function (req, res) {
    console.log( "test" );
    res.json( test );
    res.end();

});

app.get('/data/:from/:to', function (req, res){
	var from = req.params.from;
	var to = req.params.to;
	console.log("Requesting data from:%s to:%s", from, to);

	res.json({
		from : from,
		to : to
	});
	res.end();
});

app.get('/data', function (req, res){

	mongodb.MongoClient.connect(uri, function(error,db){
		if (error){
			console.log(error);
			process.exit(1);
		}

		db.collection('data').find().toArray(function(error, docs){
			if (error){
				console.log(error);
				process.exit(1);
			}
			res.send(docs);
		});
	});
});

app.post('/data', function(req, res) {
	console.log(req.body);

	if(!req.body.hasOwnProperty('time') || 
     !req.body.hasOwnProperty('position')) {
		res.statusCode = 400;
		return res.send('Error 400: Post syntax incorrect.');
	}
	else{
		if ((!req.body.position.hasOwnProperty("longitude")) ||
			(!req.body.position.hasOwnProperty("latitude")) ) {
			res.statusCode = 400;
			return res.send('Error 400: Post syntax incorrect (position).');
		}
	}
 	
	var data = {
		time : req.body.time,
		position : {
			latitude: req.body.position.latitude,
			longitude: req.body.position.longitude
		}
	}; 

	mongodb.MongoClient.connect(uri, function(error,db){
		if (error){
			console.log(error);
			process.exit(1);
		}
		db.collection("data").insert(data, function (error, result){
			if (error){
				console.log(error);
				process.exit(1);
			}
			console.log("data is in base I gess... ");
		  	res.json(data);
		  	res.end();
		});
	});
});

var server = app.listen(8081, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log("Example app listening on port : %s", port);

});