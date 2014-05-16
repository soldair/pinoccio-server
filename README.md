pinoccio-server
===============

a pinoccio command server for your local network. proxies to the pinocc.io api for historical data streams and outside access!

the neat thing is that if you use this server HQ will still work and you can still use the api streams to make rad things!
  
```js
var server = require('pinoccio-server');

server(function(troop){

  troop.command(1,'led.red',function(err,data){
    console.log('i set the led to red',data);
  })
  
})


```

you can use the troop stream directly if you want to implement your own server logic

```js

var commands = require('pinoccio-server/troop');
// example todo...

```

you can use the bridging directly if you want to hook things into the board api or bridge to more external servers.

i dont know if thats a good idea but we'll see ;)

```js

var bridge = require('pinoccio-server/bridge');
// example todo ....

```

SETUP
=====

- you will need to update your firmware to connect to your local server.
  - check out https://pinocc.io/solo for help getting started with the arduino ide
- update the ip adress to point to your local server
  - https://github.com/Pinoccio/library-pinoccio/blob/master/src/hq/HqInfo.cpp#L18
- test with the example server
  - `./bin/server.js`
- write a local server!
  - you can base it off of the example server in bin/server.js! expose your own http interface whatever you need!

