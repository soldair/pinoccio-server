
var tls = require('tls');
var net = require('net')
var fs = require('fs');
var reconnect = require('reconnect-net');
var through = require('through');
var split = require('split');
var version = require('./package.json').version;

//TODO var ca = fs.readFileSync(...);

module.exports = function(options){
  options = options||{};

  var connected = false;
  var token;
  var con;

  var recon = reconnect(function(c){
    con = c;

    con.on('error',function(err){
      console.error('bridge stream error',err); 
    });

    connected = true;
    // auth
    if(token) {
      send();
    }
    // resume.
  }).on('disconnect',function(){
    connected = false;
  });

  recon.connect({host:options.host||"pool.base.pinocc.io",port:options.port||22756});

  function send(data){
    if(connected) {
      ensurePipe();
      if(ensureToken(data) === true) return;
      if(data) con.write(JSON.stringify(data)+"\n");
    } else {
      // dropping on the floor. todo buffer
      s.emit('drop',data);
    }
  }

  function ensureToken(data){
    if(!connected) return;
    if(!con.sentToken){
      if(!token) throw JSON.stringify(data);
      con.sentToken = true;
      con.write(JSON.stringify(token)+"\n");
      if(data && data.type === 'token') return true;
    }
  }

  function ensurePipe(){
    if(con && !con.piped) {
      con.piped = true;
      con.pipe(split()).pipe(through(function(data){
        s.queue(json(data)); 
      }));
    }
  }

  var s = through(function(data){
    if(data.type == 'token') {
      token = data;
      token.bridge = version;
    }
    send(data);
  });

  s.on('pipe',function(serverStream){
    // someone piped to me.
    if(serverStream.token) {
      token = {token:serverStream.token,type:'token',bridge:version};
    }

    if(connected) send();
  });

  s.on('end',function(){
    reconnect.disconnect();
  }).on('error',function(){
    reconnect.disconnect();
  });

  s.reconnect = recon;

  return s;

}



function json(s){
  try{
    return JSON.parse(s);
  } catch(e){}
}
