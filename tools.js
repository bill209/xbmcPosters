var fs = require('fs');
// tools.js

module.exports = {
	getXBMCmovies: function(fname, callback){
		fs.readFile(fname, 'utf8', function (error, text) {
			if (error) {
				return callback({'error': true, 'errormsg' : 'file not found: ' + fname});
			} else {
				try{
					var movieData = JSON.parse(text);
					if(!movieData.id){
						return callback({'error': true, 'errormsg' : 'JSON missing data'});
					} else {
						return callback(movieData);
					};
				} catch (e) {
					return callback({'error': true, 'errormsg' : 'bad JSON: ' + e});
				}
			}
		});
	},
	getTime: function () {
		var time = new Date();
		return(
				("0" + time.getHours()).slice(-2)   + ":" +
				("0" + time.getMinutes()).slice(-2) + ":" +
				("0" + time.getSeconds()).slice(-2));
	},
	createMoviePosterFile: function(posters){
		console.log('posters',posters);
		postersJSON = JSON.stringify(posters);
		fs.writeFile('./data/posters.json', postersJSON, 'utf8', function (err) {
			if (err) return console.log('\n', err);
		});
	}
};
