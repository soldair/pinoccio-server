
var tls = require('tls');
var net = require('net')
var fs = require('fs');
var reconnect = require('reconnect-net');
var through = require('through');
var split = require('split');

//TODO var ca = fs.readFileSync(...);

module.exports = function(options){
  options = options||{};

  var connected = false;
  var token;
  var con;

  var recon = reconnect(function(c){
    con = c;

    console.log('CONNECTED!');
    con.on('error',function(){
      console.log('bridge stream error') 
    });

    connected = true;
    // auth
    if(token) {
      send();
    }
    // resume.
  }).on('disconnect',function(){

    console.log('disconnect!');
    connected = false;
  });

  recon.connect({host:options.host||"pool.base.pinocc.io",port:options.port||22756});

  function send(data){

    if(connected) {

      if(!con.sentToken){
        if(!token) throw JSON.stringify(data);
        con.sentToken = true;
        con.write(JSON.stringify(token)+"\n");
        if(data && data.type === 'token') return;
      }

      con.pipe(split()).pipe(through(function(data){
        s.queue(json(data)); 
      }));

      console.log('sending to bridge!');
      if(data) con.write(JSON.stringify(data)+"\n");
      
    } else {
      console.log('dropping',data);
    }
    // dropping on the floor. todo buffer some
    s.emit('drop',data);
  }


  var s = through(function(data){
    if(data.type == 'token') {
      token = data;
      token.bridge = true;
    }
    send(data);
  });

  s.on('pipe',function(serverStream){
    // someone piped to me.
    if(serverStream.token && !tokenSent) {
      tokenSent = true;
      token = serverStream.token;
      send()
    }

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
