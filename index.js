
var commands = require('./troop.js') 
var bridge = require('./bridge.js');
var net = require('net');
// todo tls server. this should hold both ports open 22756 and 22757 tls

module.exports = function(options,onConnection){
  options = _options(options);
  if(!options.handler && onConnection) options.handler = onConnection;
  var server = net.createServer(module.exports.handler(options));

  server.listen(options.port,function(err){
    if(err) throw err;
  });

  return server;
}

// in pinoccio-api i use this and define the servers myself. its a much better pattern.
module.exports.handler = function(options){
  options = _options(options);
  if(!options.handler) {
    throw new Error("please provide options.handler / onConnection. otherwise there isnt much point.");
  }
  return function(con){
    var i = 0, s;

    con.on('error',function(err){
      console.log('scout tcp connection error. '+err);
      s.end();      
    })

    s = commands(con,function(err){

      s.socket = con;
      // support multiple connections.      
      s.connectionId = con.remoteAddress+' | '+con.remotePort;

      if(err) {
        // todo figure out right way to handle this.
        console.error('could not start command stream. closing connection. ',err);
        return con.destroy();
      }
      if(!options.bridge){
        options.handler.call(this,s);
      } else {
        s.pipe(bridge({host:options.apiHost,port:options.apiPort})).pipe(s.commandStream());
        options.handler.call(this,s);
      }
    });

  }
}

function _options(options){
  options = options||{};
  if(typeof options === 'function') {
    options.handler = options;
    options = {};
  }

  options.apiHost = options.apiHost||'pool.base.pinocc.io';
  options.apiPort = options.apiPort||22756;
  options.port = options.port||22756;
  
  return options;
}
