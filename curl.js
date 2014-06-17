/*
	objective: create a list of movie poster URLs based on a json list of movie titles
	input: 		xbmc movie list (json)
	output: 	list of URLs to movie posters (json) ../data/posters.json
	technique explored:  http.get, q.all
*/
var RT_DELAY = 500;
var http = require('http');
var q = require('q');
var t = require('./tools.js');
var xbmcMovies = 'data/8movies.json';
//var jMovies = [];

// the rotten tomatoes api URL. the name of the movie will be swapped with the {{title}} parameter.
var queue=[];

// loop through the list of movies and push a call to the callRottenTomatoes function for each one
// var looperz = function(jMovies){
// //console.log('jMovies',jMovies.result.movies);
// console.log('movies',movies);
// 	jMovies.result.movies.forEach(function(val, idx, arr){
// 		queue.push(callRottenTomatoes(val.title));
// 	});
// 	settleAll();
// };
console.log('---------------------------:: ' + t.getTime() + ' ::---------------------------\n');

t.getXBMCmovies(xbmcMovies, function(movies){
	if(movies.error){
		console.log(movies.errormsg);
	} else {
		looper(movies);
	}
});

/*
 	this is a recursive routine that loops through the list of movies and pushes
	a call to callRottenTomatoes onto the queue for each movie
 	note: the delay is required to prevent RT from refusing the request
	note: could not work the delay into the simpler .forEach structure
*/
var looper = function(jMovies){
	var j = 0;
	var loopit = function(movies, j){
		if(j % 10 === 0){
			process.stdout.write('\n' + j + '. ');
		} else {
			process.stdout.write('.');
		}
		if(j < jMovies.result.movies.length ){
			setTimeout(function(){
				loopit(jMovies.result.movies,++j);
			},RT_DELAY);
			queue.push(callRottenTomatoes(movies[j].title));
		} else {
			process.stdout.write('\n');
			settleAll();
		}
	}
	loopit(jMovies.result.movies,j);
}

function settleAll(){
	// this process after all the api calls have been made
	q.allSettled(queue).then(function(ful) {
		var msg = '', moviePosters = [];
		ful.forEach(function(val, idx, arr){
				// pull out the correct content, based on success or failure
				if(val.state === 'fulfilled'){
					msg = '(' + val.value.id + ') ' + val.value.title;
					moviePosters.push({ 'id' : val.value.id, 'title': val.value.title, 'URL': val.value.URLoriginal });
				} else {
					msg = 'error: ' + val.reason;
//					moviesNotFound.push({ 'id' : val.value.id, 'title': val.value.title, 'URL': val.value.URLoriginal });
				}
				process.stdout.write(idx + '. ' + msg + '\n');
			}
		);
		console.log('\n');
		t.createMoviePosterFile(moviePosters);
	});
}

/*
	objective: call the rotten tomatoes api to get the URL for a movie's poster
	input: 		(title)	movie title
	output: 	movie poster URL
*/
function callRottenTomatoes(title){
	var deferred = q.defer();
	var opts = {
		host: 'api.rottentomatoes.com',
		path: '/api/public/v1.0/movies.json?apikey=jq7aydjmufspr54dcffw7f66&q=' + escape(title) + '&page_limit=1&callback=JSON_CALLBACK'
	};
	// call the api
	var httpget = function(opts){
		var movieData = '';
		var req = http.get(opts, function(res){
			if(res.statusCode != 200){
				deferred.reject('page not found: ' + opts.host+opts.path);
			} else {
			 	res.setEncoding('utf8');
			 	// this may be called multiple times for each http.get, hence the name 'chunk'
	 			res.on('data', function(chunk){
					movieData += chunk;
				});
				res.on('end', function(){
					// strip out the callback portion of the jsonp response
					movieData = movieData.replace( 'JSON_CALLBACK(', '' ).trim();
					movieData = movieData.substr( 0, movieData.length - 1 );
					movieData = JSON.parse(movieData);

					if(movieData.total == 0){
						deferred.reject('movie not found: ' + title);
					} else {
						// success   : )
						deferred.resolve({ 'id' : movieData.movies[0].id, 'title' : movieData.movies[0].title, 'URLoriginal' : movieData.movies[0].posters.original});
					}
				});
				// not sure how/why this reject gets called
				res.on('error',function(err){
					deferred.reject(err);
				});
			}
		});
		// this reject is called when the actual http.get bugs out (such as 404)
		req.on('error', function(err){
			deferred.reject(err);
		});
	}
	httpget(opts);
	return deferred.promise;
}

