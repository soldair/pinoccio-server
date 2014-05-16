#!/usr/bin/env node

// this is an example server!
// it shows you how to use this awesome thing!

var server = require('../')


server({
  apiHost:process.env.PINOCCIO_API||'pool.base.pinocc.io',
  apiPort:process.env.PINOCCIO_PORT||22756
},function(troop){
  // blink the led
  // while this is running perhaps watch hq! and a sync stream!

  troop.on('data',function(ev){
    console.log(troop.token+'>',JSON.stringify(ev));
  });

  var i = 0;
  (function light(){
    if(!troop.writable) return console.log('disconnect');
    var command = "led.red";
    if(i ^= 1) command = "led.blue";
    console.log(command);
    troop.command(1,command,function(){
      light();
    });
  }()) 

}).on('listening',function(){
  console.log('local pinoccio server listening on ',this.address());
})

