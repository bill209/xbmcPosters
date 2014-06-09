var http = require('http');
var fs = require('fs');

var path =  '/Users/billrowland/Sites/repos';

console.log('LETS BEGIN.............');

function oDir(p,cb){

	fs.readdir(path,function(err,files){
		if(err)
			{ console.log('error on readdir')
		} else {
			cb(files);
		}

	});

};

http.createServer(function (req, res) {
	oDir('/', function (data) {
		res.writeHead(200, {
			'Content-Type': 'text/html; charset=utf-8'
		});

		data = data + '--- signed by bill';


		res.end(JSON.stringify(data));
	});
}).listen(8080, '127.0.0.1');
