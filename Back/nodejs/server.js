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
	var lng1 = req.query.lng1;
	var lng2 = req.query.lng2;
	var lat1 = req.query.lat1; 
	var lat2 = req.query.lat2; 

	console.log("Requesting data from:%s to:%s with sphere like c:[%s, %s]" , from, to, lng1, lat1);
	mongodb.MongoClient.connect(uri, function(error,db){

		if (error){
			console.log(error);
			process.exit(1);
		}
		
		if (!to && !from && !lng1 && !lat1 && !lng2 && !lat2){
			db.collection('data').find().toArray(function(error, docs){
				if (error){
					console.log(error);
					process.exit(1);
				}
				res.send(docs);
				res.end();
			});
		}else if (!to && from && lng1 && lat1 && lng2 && lat2){

			console.log("yolo");
			db.collection('data').find(
				{"position" : 
					{ "$geoWithin" :
                        { "$geometry" :
                            { "type": "Polygon",
                              "coordinates" : [[
                              	[ Number(lat1) , Number(lng1) ],
                              	[ Number(lat2) , Number(lng1) ],
                              	[ Number(lat2) , Number(lng2) ],
                              	[ Number(lat1) , Number(lng2) ],
                              	[ Number(lat1) , Number(lng1) ]
                              ]],
                            } ,
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
		else if (to && !from && lng1 && lat1 && lng2 && lat2){

			console.log(new Date(to));

			db.collection('data').find({"$and" : 
				[ 
				{"time" : {"$lte": new Date(to)} },
				{"position" : 
					{ "$geoWithin" :
                        { "$geometry" :
                            { "type": "Polygon",
                              "coordinates" : [[
                              	[ Number(lat1) , Number(lng1) ],
                              	[ Number(lat2) , Number(lng1) ],
                              	[ Number(lat2) , Number(lng2) ],
                              	[ Number(lat1) , Number(lng2) ],
                              	[ Number(lat1) , Number(lng1) ]
                              ]],
                            } ,
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
		else if (to && from && lng1 && lat1 && lng2 && lat2){

			console.log(new Date(to));
			console.log(new Date(from));

			db.collection('data').find({"$and" : 
				[ 
				{"time" : {"$lte": new Date(to)} },
				{"time" : {"$gte": new Date(from)} },
				{"position" : 
					{ "$geoWithin" :
                        { "$geometry" :
                            { "type": "Polygon",
                              "coordinates" : [[
                              	[ Number(lat1) , Number(lng1) ],
                              	[ Number(lat2) , Number(lng1) ],
                              	[ Number(lat2) , Number(lng2) ],
                              	[ Number(lat1) , Number(lng2) ],
                              	[ Number(lat1) , Number(lng1) ]
                              ]],
                            } ,
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
		}else{
			res.send({message: "error, argument left"});
			res.end();
		}
	});
});
/*
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

 */
function kmeans_func (data){

	
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
}

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