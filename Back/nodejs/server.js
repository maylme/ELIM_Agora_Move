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
		}else{
			if (!to && from){
				console.log(new Date(from));

				db.collection('data').find({"time" : {"$gte": new Date(from)}}).toArray(function(error, docs){
					if (error){
						console.log(error);
						process.exit(1);
					}
					console.log("result", docs);
					res.end();
				});
			}
		}
	});
});

app.post('/data', function(req, res) {
	console.log(req.body);

	if(!req.body.hasOwnProperty('position')||
		!req.body.hasOwnProperty('user_id')) {
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
		user_id: req.body.user_id,
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