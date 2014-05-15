
var commands = require('./index.js') 

var net = require('net');

var i = 0;

var server = net.createServer(function(con){
  commands(con,function(err,stream){
    console.log('connection ready!',stream.token);
    if( i ^= 1) {
      stream.command(1,'led.red',function(err,data){
        console.log('led.red command callback!',err,data);
      });
    } else {
      stream.command(1,'led.blue',function(err,data){
        console.log('led.blue command callback!',err,data);
      });
    }
    //setTimeout(function(){
    //  con.end();
    //},1000);
  })
});

// 22756 plain tcp, 22757 tls
server.listen(process.env.PINOCCIO_PORT||22756,function(err){
  if(err) throw err;
  console.log('server started ',this.address());
});


