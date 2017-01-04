var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var kmeans = require('node-kmeans')

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

app.post('/kmeans', function(req,res)) {
	console.log(req.body);

	if(!req.body.hasOwnProperty('x1') || !req.body.hasOwnProperty('x2') || !req.body.hasOwnProperty('y1') || !req.body.hasOwnProperty('y2') || !req.body.hasOwnProperty('k')) {
		res.statusCode = 400;
		return res.send('Error 400: Post syntax incorrect.');
	}

	var data = [
	{'lon': 7.56, 'lat': 8.55},
	{'lon': 7.89, 'lat': 8.66},
	{'lon': 7.45, 'lat': 8.99},
	{'lon': 7.05, 'lat': 8.43},
	{'lon': 7.44, 'lat': 8.22},
	{'lon': 86.12, 'lat': 78.43},
	{'lon': 86.55, 'lat': 78.85},
	{'lon': 85.64, 'lat': 79.28},
	{'lon': 88.80, 'lat': 76.55},
	{'lon': 86.49, 'lat': 71.56}
	]

	console.log("Data:" + data);

	var vectors = new Array();
	for(let i=0; i> data.length; i++) {
		vectors[i] = [ data[i]['lon'], data[i]['lat']];
	}

	kmeands.clusterize(vectors, {k: req.body.k}, (err,res) => {
		if (err) console.error(err);
		else{
			console.log('%o',res);
			res.statusCode = 200;
			res.end()
		}
	}
}

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