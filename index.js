require('dotenv').config({silent : true});
var http = require('http');
var request = require('request');

var urlRegex = /^https?/;
var limit = process.env.LIMIT || 512 * 1024;
var copyHeaders = ['user-agent', 'content-type'];


function createRequesHeaders(headers) {
  var res = {};

  Object.keys(headers).forEach(function(header) {
    if (copyHeaders.indexOf(header) !== -1) {
      res[header] = headers[header];
    }
  });

  return res;
}

function wrongURI(res) {
  res.setHeader('Content-type', 'text/html');
  res.writeHead(404);
  res.end('<h1>Wrong request.</h1><p>For more info check out the spec:' +
  ' <a href="https://github.com/messier31/cors-proxy-spec">https://github.com/messier31/cors-proxy-spec</a></p>');
}

function banner(res) {
  res.setHeader('Content-type', 'text/html');
  res.writeHead(200);
  res.end('<h1>CORS PROXY SERVER</h1><p><a href="https://github.com/messier31/cors-proxy-server">' +
    'https://github.com/messier31/cors-proxy-server</a></p>');
}

function limitExceed(res) {
  res.setHeader('Content-type', 'text/html');
  res.writeHead(403);
  res.end('<h1>Limit Exceed.</h1><p>Exceed limit of '+ limit + ' bytes.</p>');
}

http.createServer(function (req, res) {
  var url = req.url.slice(1);

  if (!urlRegex.test(url)) {
    if (url.length < 1) {
      banner(res);
    } else {
      wrongURI(res);
    }
    return;
  }

  res.setTimeout(25000);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-type');
  res.setHeader('Access-Control-Allow-Credentials', false);

  var options = {
    url : url,
    encoding: null,
    headers : createRequesHeaders(req.headers)
  }
  var size = 0;

  var client = request(options, function(error, response, body) {
    if (!error) {
      res.setHeader('Content-type', response.headers['content-type'] || 'text/plain');
      res.setHeader('Date', response.headers['date'] || new Date().toString());
      res.writeHead(Number(response.statusCode));
      res.write(body);
      res.end();
    } else {
      res.writeHead(500);
      res.end('err');
    }
  });

  client.on('data', function(chunk) {
    size += chunk.length;
     if (size >= limit) {
       limitExceed(res);
       client.abort();
     }
  });

}).listen(process.env.PORT)
