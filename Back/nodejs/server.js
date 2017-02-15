var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");

var uri = "mongodb://localhost:27017/elim";


var initial_datas=[
	{
		time:"2016-12-18T12:52:46+00:00",
		position:  {
	      "type" : "Point",
	      "coordinates" : [ -73.778889, 40.639722 ]
	    }
	}
];
/* 
db.bar.createIndex({point:"2dsphere"});
*/
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
	var longitude = req.query.longitude;
	var latitude = req.query.latitude;
	var distance = req.query.distance; 

	console.log("Requesting data from:%s to:%s with sphere like c:[%s, %s] d:%s" , from, to, longitude, latitude, distance);
	mongodb.MongoClient.connect(uri, function(error,db){

		if (error){
			console.log(error);
			process.exit(1);
		}
		
		if (!to && !from && !longitude && !latitude && !distance){
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
		}else if (!to && from && longitude && latitude && distance){

			console.log("yolo");
			db.collection('data').find(
				{"position" : 
					{ "$near" :
                        { "$geometry" :
                            { "type" : "Point" ,
                              "coordinates" : [ Number(longitude) , Number(latitude) ]
                            } ,
                            "$maxDistance" : Number(distance) /* in meters */
                        }     
                    }  
                 }).toArray(function(error, docs){
				if (error){
					console.log(error);
					process.exit(1);
				}
				var i = 0;
				res.send(docs);
				res.end();
			});
		}
		else if (to && !from && longitude && latitude && distance){

			console.log(new Date(to));

			db.collection('data').find({"$and" : 
				[ 
				{"time" : {"$lte": new Date(to)} },
				{"position" : 
					{ "$near" :
                        { "$geometry" :
                            { "type" : "Point" ,
                              "coordinates" : [ Number(longitude) , Number(latitude) ]
                            } ,
                            "$maxDistance" : Number(distance) /* in meters */
                        }     
                    }  
                }
				] }).toArray(function(error, docs){
				if (error){
					console.error(error);
					process.exit(1);
				}
				res.send(docs);
				res.end();
			});
		}
		else if (to && from && longitude && latitude && distance){

			console.log(new Date(to));
			console.log(new Date(from));

			db.collection('data').find({"$and" : 
				[ 
				{"time" : {"$lte": new Date(to)} },
				{"time" : {"$gte": new Date(from)} },
				{"position" : 
					{ "$near" :
                        { "$geometry" :
                            { "type" : "Point" ,
                              "coordinates" : [ Number(longitude) , Number(latitude) ]
                            } ,
                            "$maxDistance" : Number(distance)	 /* in meters */
                        }     
                    }  
                }
				] }).toArray(function(error, docs){
				if (error){
					console.log(error);
					process.exit(1);
				}
				var i = 0;
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
				res.send(docs);
				res.end();
			});
		}else if(to && from){
			console.log(new Date(to));
			console.log(new Date(from));

			db.collection('data').find({"$and" : 
				[{"time" : {"$lte": new Date(to)} }, 
				{"time" : {"$gte": new Date(from)} }] }).toArray(function(error, docs){
				if (error){
					console.log(error);
					process.exit(1);
				}
				
				res.send(docs);
				res.end();
			});
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
	      "type" : "Point",
	      "coordinates" : [ Number(req.body.position.longitude), Number(req.body.position.latitude) ]
	    }
	}; 

	mongodb.MongoClient.connect(uri, function(error,db){
		if (error){
			console.log(error);
			process.exit(1);
		}
		//db.collection('data').createIndex({position:"2dsphere"});

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