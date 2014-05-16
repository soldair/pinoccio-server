
var commands = require('./troop.js') 
var bridge = require('./bridge.js');
var net = require('net');
// todo tls server. this should hold both ports open 22756 and 22757 tls

module.exports = function(options,onConnection){
  options = options||{};
  if(typeof options === 'function') {
    onConnection = options;
    options = {};
  }

  options.apiHost = options.apiHost||'pool.base.pinocc.io';
  options.apiPort = options.apiPort||22756;
  options.port = options.port||22756;

  var server = net.createServer(function(con){
    var i = 0, s;

    s = commands(con,function(err){
      if(err) {
        // todo figure out right way to handle this.
        console.error('could not start command stream. closing connection. ',err);
        return con.destroy();
      }

      s.pipe(bridge({host:options.apiHost,port:options.apiPort})).pipe(s.commandStream());
      onConnection(s);
    });

  });

  server.listen(options.port,function(err){
    if(err) throw err;
  });

  return server;

}


