
var commands = require('./index.js') 
var bridge = require('./bridge');
var net = require('net');


var server = net.createServer(function(con){
  var i = 0;
  var s = commands(con,function(err,stream){
    console.log('connection ready!',stream.token);
    function light(){
      if( i ^= 1) {
        stream.command(1,'led.red',function(err,data){
          console.log('led.red command callback!',err,data);
          light();
        });
      } else {
        stream.command(1,'led.blue',function(err,data){
          console.log('led.blue command callback!',err,data);
          light();
        });
      }
    };

    light();

  });

  // i love data. you should use this event stream for stuff you can't use when the net is down.
  s.on('data',function(data){
    console.log('ev>',data);
  });

  // connect to cloud!
  s.pipe(bridge({host:'localhost',port:22758})).pipe(s.commandStream());

});

// 22756 plain tcp, 22757 tls
server.listen(process.env.PINOCCIO_PORT||22756,function(err){
  if(err) throw err;
  console.log('server started ',this.address());
});


