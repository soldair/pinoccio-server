// the pinoccio json event stream/rpc protocol
var split = require('split');
var through = require('through');
var maxId = 255;// this can be bigger.

module.exports = function(socket,readycb){

  // wait 60 seconds for the connection to present a token before kicking off.
  var readyTimeout = setTimeout(function(){
    if(!stream.token) {
      readycb(new Error('stream never authenticated'));
      readycb = function(){};
      stream.log('stream never authenticated.');
      socket.destroy();
    }
  },60000);// make configurable

  var fromBoard = split();
  fromBoard.pipe(through(function(line){
    stream.lastLine = Date.now();
    var js = json(line);
    if(js) handle(js, line);
    else handleInvalidJSON(line);    
  },function(){
    this.queue('null');
    stream.end();
  }));

  var toBoard = through(function(js){
    this.queue(JSON.stringify(js)+"\n");
  })

  socket.pipe(fromBoard);
  toBoard.pipe(socket);

  /// troop events stream. and public interface
  var stream = through();

  stream.command = function(scout,command,cb){
    if(!stream.token) return setImmediate(function(){
      cb(new Error('not ready'));
    });
    if(typeof command === 'function') return setImmediate(function(){
      cb(new Error('you passed a function instead of a command. command(scoutid,command,callback)'));
    });

    sendCommand({
      to:scout,
      command:command
    },cb);
  };

  stream._commandStreams = {};
  stream._commandStreamInc = 0;
  stream.commandStream = function(){
    // TODO this is how other servers send commands to this server.
    // this stream gets data events of commands.
    // this stream outputs the event stream
    var s = through(function(data){
      var z = this;
      if(!data) return;
      if(data.type == 'command'){ 
        var origid = data.id;
        sendCommand(data,function(err,res){

          res.id = origid; // map this back to the source api server.\
          if(data.api) res.apiid = data.api;

          // to support multiple layers of proxy i would have to check to make sure api id 
          // matches this api before calling callback if its set. 
          stream.queue(res);// write the response to the events stream.
        });
      } else {
        // this is some kind of ping / fire and forget message.
        toBoard.write(data);
      }
    });
    var id = stream._commandStreamInc++;
    stream._commandStreams[id] = s;

    s.id = id;

    return s;

  }

  stream.sendCommand = sendCommand;

  stream.inc = 0;
  stream.callbacks = {};
  stream.lastLine = Date.now();  
  stream.log = function(data){
    this.emit('log',data)
  };

  stream.troop = false;// cannot send commands to boards that have not provided a token.

  function handle(js,line){
    // handle message from board.
    //stream.log("handle",stream.token,line);

    var hasToken = stream.token;
    if(js.type == "token") {

      // send in event stream.
      stream.queue(js); 
      stream.token = js.token;

      if(!hasToken) {
        readycb(false,stream);
        clearTimeout(readyTimeout); 
      }
      return;
    }

    if(!stream.token) return stream.log('data from socket before auth/id token.',js);

    if(js.type == 'reply'){

      o = stream.callbacks[js.id]||{};

      if(o.id === undefined) return stream.log('got reply with no id mapping! ',js);


      var output = js.output||js.reply||"";
      var ret = js.return;// not set yet.

      if(!o.output) o.output = "";
      // handle chunked responses. they come in order.
      o.output += output;

      // soon the firmware will support returning the return int value of the scout script function/expression. it willbe the property return.
      if(ret) {
        o.return = ret;
      }

      js._cid = js.id;
      js.id = o.id;

      if(js.err || js.end) {

        delete stream.callbacks[js._cid];
        js.reply = js.output = o.output;
        js.return = o.return;
        o.cb(js.err,js)
      }

    } else if(js.type == "report" && line == stream._lastreport){
      // duplicate reports are not really useful to propagate as events because nothing changed.
      return;// stream.log('duplicate report ',line);
    } else if (js.type == "report") {
      stream._lastreport = line;
      stream.queue(js);// send report in stream.
    } else {
      stream.log('unknown message type',js);
    }
  }

  function handleInvalidJSON(line){
    stream.log('invalid json todo',line);
  }

  // command format
  // 
  /*
  {
    type:"command",
    to:+scout,
    timeout:10000,// option timeout defaults to 10000
    command:"print millis;"
  }
  */
  // just send a command!
  function sendCommand(js,cb){
    if(!js) return stream.log('send command got no command!',js);
    var id = ++stream.inc;
    if(!js.id) js.id = 0;// default input id.

    var start = Date.now();
    var timeCallback = function(err,js){
      js.basetime = Date.now()-start;// decorate performance time.
      if(cb) cb(err,js)
    }

    if(js.timeout == undefined) js.timeout = 10000;
    else if(js.timeout < 0) {
      js.timeout = 60000;// 60 seconds max timeout
    } else if(js.timeout > 60000){
      js.timeout = 60000; 
    }
    
    var timeout = js.timeout;
    setTimeout(function(){
      if(stream.callbacks[id]) {
        // make reply js
        js.type = "reply";
        js.err = "base timeout in "+timeout+" ms";
        js.timeout = timeout;
        js.timeerror = true;
        js.from = js.to;
        delete js.to;
        timeCallback(true,js);
      }
    },timeout);

    stream.callbacks[id] = {id:js.id,cb:timeCallback};
    js.id = id;

    if(stream.inc > maxId) stream.inc = 1;

    js.type = "command";
    toBoard.write(js);
  
    return js;
  }

  return stream;
}

function json(s){
  try{
    return JSON.parse(s);
  } catch(e){}
}
