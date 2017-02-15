var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var kmeans = require('node-kmeans');
var gs = require("gap-stat");

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
	data: "test ok"
};

var datas = [];
app.get('/test', function (req, res) {
    console.log( "test" );
    res.json( test );
    res.end();

});

app.get('/data', function (req, res){
	var from = req.query.from;
	var to = req.query.to;

	console.log("Requesting data from:%s to:%s", from, to);
	mongodb.MongoClient.connect(uri, function(error,db){
		if (error){
			console.log(error);
			process.exit(1);
		}
		
		if (!to && !from){
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
				res.end();
			});
		}else if (!to && from){
			console.log(new Date(from));

			db.collection('data').find({"time" : {"$gte": new Date(from)}}).toArray(function(error, docs){
				if (error){
					console.log(error);
					process.exit(1);
				}
				console.log("result", docs);
				res.send(docs);
				res.end();
			});
		}
		else if (to && !from){
			console.log(new Date(to));

			db.collection('data').find({"time" : {"$lte": new Date(to)}}).toArray(function(error, docs){
				if (error){
					console.log(error);
					process.exit(1);
				}
				console.log("result", docs);
				res.send(docs);
				res.end();
			});
		}else if(to && from){
			console.log(new Date(to));
			console.log(new Date(from));

			db.collection('data').find({"$and" : 
				[{"time" : {"$lte": new Date(to)} }, 
				{"time" : {"$gte": new Date(to)} }] }).toArray(function(error, docs){
				if (error){
					console.log(error);
					process.exit(1);
				}
				console.log("result", docs);
				res.send(docs);
				res.end();
			});
		}
	});
});

app.get('/kmeans', function(req,res) {
	console.log(req.body);

	var x1 = req.query.x1;
	var x2 = req.query.x2;
	var y1 = req.query.y1;
	var y2 = req.query.y2;
	var time = req.query.time;

	if (!(x1&&x2&&y1&&y2&&time)){
	 	res.statusCode = 400;
	 	return res.send('Error 400: GET syntax incorrect : param missing.');
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
		{'lon': 86.49, 'lat': 71.56},
		{'lon': 100.49, 'lat': 152.54},
		{'lon': 101.49, 'lat': 152.56},
		{'lon': 100.58, 'lat': 152.56},
		{'lon': 99.76, 'lat': 153.56},
	]

	var vectors = new Array();
	for(var i=0; i< data.length; i++) {
		vectors[i] = [ data[i]['lon'], data[i]['lat']];
	}

	var goodk = gs.gap_statistic(vectors, 1, 10);

	var rep = 1;
	for(var i=1; i<goodk.gaps.length; i++) {
		if(goodk.gaps[i]<0.5)
			continue
		else {
			rep = i+1;
			break;
		}
	}
	/*console.log('best cluster size is '+goodk.cluster_size);
	console.log('My best is '+ rep);
	console.log('Gap '+goodk.gaps);
	console.log('gap_stddevs '+goodk.gap_stddevs);*/

	kmeans.clusterize(vectors, {k: rep}, (err,result) => {
		if (err){
			console.error(err);
			res.end(err);
			return;
		}
		else{
			console.log('%o',result);
			res.statusCode = 200;
			res.send(result);
			res.end();
			return;
		}
	});
});

app.post('/data', function(req, res) {
	console.log(req.body);

	if(!req.body.hasOwnProperty('position')) {
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
		time : new Date(),
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
			console.log("data is in base I guess... ");
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