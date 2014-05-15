// the pinoccio json stream/rpc protocol
var split = require('split');
var through = require('through');

module.exports = function(){

  var _split = split();
  var stream = through(function(data){
    _split.write(data);
  });


  stream.id = 0;
  stream.callbacks = {};
  stream.lastLine = Date.now();  

  stream.log = console.log.bind(console);

  var transform = instream.pipe(through(function (line) {
    stream.lastLine = Date.now();
    var js = json(line);
    if(js) handle(socket, js, line);
    else handleInvalidJSON(socket,line); 
  }));

  _split.pipe(transform);

  function handle(){

  }

  function handleInvalidJSON(){

  }

  return instream; 
}

function json(s){
  try{
    return s;
  } catch(e){}
  return;
}
