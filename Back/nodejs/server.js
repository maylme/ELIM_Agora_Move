var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var kmeans = require('node-kmeans');
var gs = require("gap-stat");
var uri = "mongodb://localhost:27017/elim";
const turfConcave= require('@turf/concave');
const turfConvex = require('@turf/convex');
const turfHelper = require("@turf/helpers");

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

	console.log("Requesting data from:%s to:%s with polygon like c:[%s, %s]" , from, to, lng1, lat1);
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
				do_kmeans(docs,function(result){
					res.send(result);
					res.end();
				});
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
				do_kmeans(docs,function(result){
					res.send(result);
					res.end();
				});
			});
		}
		else if (to && from && lng1 && lat1 && lng2 && lat2){

			console.log("to", new Date(to));
			console.log("from", new Date(from));
			console.log("lat1", Number(lat1));
			console.log("lat2", Number(lat2));
			console.log("lng1", Number(lng1));
			console.log("lng2", Number(lng2));


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
				console.log("docs:",docs);
				do_kmeans(docs,function(result){
					res.send(result);
					res.end();
				});
			});
		}else if (!to && from){
			console.log(new Date(from));

			db.collection('data').find({"time" : {"$gte": new Date(from)}}).toArray(function(error, docs){
				if (error){
					console.log(error);
					process.exit(1);
				}
				do_kmeans(docs,function(result){
					res.send(result);
					res.end();
				});
			});
		}
		else if (to && !from){
			console.log(new Date(to));

			db.collection('data').find({"time" : {"$lte": new Date(to)}}).toArray(function(error, docs){
				if (error){
					console.log(error);
					process.exit(1);
				}
				do_kmeans(docs,function(result){
					res.send(result);
					res.end();
				});
			});
		}else if(to && from){
			console.log("from_to");

			db.collection('data').find({"$and" : 
				[{"time" : {"$lte": new Date(to)} }, 
				{"time" : {"$gte": new Date(from)} }] }).toArray(function(error, docs){
				if (error){
					console.log(error);
					process.exit(1);
				}
				do_kmeans(docs,function(result){
					res.send(result);
					res.end();
				});
				
			});
		}else{
			res.send({message: "error, argument left"});
			res.end();
		}
	});
});
function do_kmeans(docs, cb){
	var data = [];
	if (docs && docs.length > 0){
		for(var counter =0; counter<docs.length;counter++) {
			data.push(docs[counter].position.coordinates);
		}
		kmeans_func(data, function(result){
			console.log("kmeans result ",result);
			var grpCluster = [];
		
			for(var counter = 0; counter<result.length;counter++) {
				grpCluster.push(result[counter].cluster);
			}
			console.log("grp cluster", grpCluster);
			var clusters=[];
			for (var index in grpCluster){
				var cluster = grpCluster[index];
				var features=[];
				console.log("un cluster : ", cluster);
				if (cluster.length < 3){
					/* ignore it */
					console.log("trop petit");
				}else{
					/*convert point to feature*/
					for (var i in cluster ){
						var geometry = {
						     "type": "Point",
						     "coordinates": cluster[i]
						   };
						features.push(turfHelper.feature(geometry));
					}
					var fc = turfHelper.featureCollection(features);
					var poly={};
					try{
						poly = turfConcave(fc, 1);
					}catch(e){
						//console.log(e);
						poly = turfConvex(fc);
					}
					console.log("poly",poly);
					if(poly){
						clusters.push({
							size: cluster.length,
							polygon : poly.geometry.coordinates
						});
					}
					
				}
			}
			cb(clusters);

		});
	}else{
		cb([]);
	}
}
function kmeans_func (data, cb){

	let vectors = new Array();

	for(var i=0; i< data.length; i++) {
		vectors[i] = data[i];
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

	kmeans.clusterize(vectors, {k: 4}, (err,result) => {
		if (err){
			console.error(err);
			//res.end(err);
			return;
		}
		else{
			//console.log('%o',result);
			//res.statusCode = 200;
			cb(result);
			//res= result;
			//res.send(result);
			//res.end();
			
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
	      "coordinates" : [ Number(req.body.position.latitude), Number(req.body.position.longitude) ]
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
app.post('/cheating', function(req, res) {
    console.log(req.body);

    if(!req.body.hasOwnProperty('position')) {
            res.statusCode = 400;
            return res.send('Error 400: Post syntax incorrect.');
    }
    else{   
            if ((!req.body.position.hasOwnProperty("longitude")) ||
                    (!req.body.position.hasOwnProperty("latitude")) || !req.body.hasOwnProperty("date")) {
                    res.statusCode = 400;
                    return res.send('Error 400: Post syntax incorrect (position).');
            }
    }

    var data = {
            time : new Date(req.body.date),
            position : {
          "type" : "Point",
          "coordinates" : [ Number(req.body.position.latitude), Number(req.body.position.longitude) ]
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