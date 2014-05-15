//
//

var net = require('net');

var server = net.createServer(function(con){
  
});

server.listen(process.env.port||processs.env.PORT||8003,function(err){
  if(err) throw err;
  console.log('server started ',this.address());
});


