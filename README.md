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

### Connect your Troop to your server

#### Option 1: Using Bridge Mode

Plug in your Scout (USB), turn it on, and bridge it (in a new terminal tab)...

```
$ pinoccio bridge -v --host 127.0.0.1
```

By default, your sever will be running on localhost. We added `-v` to get verbose output, which is more fun.

#### Option 2: Using a WiFi Lead Scout

Set a new HQ address on the Lead Scout and reassociate the WiFi.

```
> hq.setaddress("YOUR_IP_ADDRESS"); wifi.reassociate;
```

Your Lead will disconnect from Pinoccio's HQ, and reconnect to your local server (you'll see some output in your terminal when it does).

If you want to make this change stick when your Lead Scout reboots, you'll need to add it to your startup function, e.g.

```
> function startup {hq.setaddress("YOUR_IP_ADDRESS"); wifi.reassociate;}
```

