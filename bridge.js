
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
      //console.log('NO TOKEN IN CONNECTION EVENT!');
      send();
    }

    ensurePipe();
    ensureToken();

    //con.on('data',function(data){
      //console.log('from carlo>>'+data);
    //});

    // resume.
  }).on('disconnect',function(){
    //console.log('disconnect!');
    connected = false;
  });

  recon.connect({host:options.host||"pool.base.pinocc.io",port:options.port||22756});

  function send(data){
    //console.log('to carlo << ',JSON.stringify(data));
    if(connected) {
      ensurePipe();
      if(ensureToken(data) === true) return;
      if(data) con.write(JSON.stringify(data)+"\n");
    } else {
      // dropping on the floor. todo buffer
      s.emit('drop',data);
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

    //console.log('PIPE!',token,serverStream.token,connected);

    // someone piped to me.
    if(serverStream.token) {
      token = {token:serverStream.token,type:'token',bridge:version};
    }

    if(connected) send();
  }).on('end',function(){
    recon.disconnect();
  }).on('error',function(){
    recon.disconnect();
  });

  s.reconnect = recon;

  function ensureToken(data){

    //console.log('ENSURE TOKEN'.data);

    if(!connected) {

      //console.log('1 not connected');
      return;
    }
    if(!con.sentToken){


      //console.log('3 not sent token',token);

      if(!token) {
        if(data) console.log("[ERROR] cannot send data before sending token and i have no token to send yet!");
        return;
      } 

      con.sentToken = true;
      con.write(JSON.stringify(token)+"\n");

      ///console.log('4 sending token!',token);

      if(data && data.type === 'token') return true;
    } else {
      //console.log('2 sent token already');
    }
  }

  function ensurePipe(){
    if(con && !con.piped) {
      con.piped = true;
      con.pipe(split()).pipe(through(function(data){
        //console.log('\n@@@@@@@@@@@@@ queuing data on bridge stream "'+data+'"\n');
        if(data.length) s.queue(json(data)); 
      }));
    }
  }


  return s;

}



function json(s){
  try{
    return JSON.parse(s);
  } catch(e){}
}
