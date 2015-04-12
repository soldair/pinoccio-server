//can load lib
var test = require('tape');

test("pinoccio-server loads.",function(t){
  var pserver = require('../')
  t.ok(pserver,'should have export');
  t.ok(pserver.handler,'should have handler export');
  var thrown = false;
  try{
    pserver.handler()
  } catch(e){
    thrown = e;
  }

  t.ok((thrown+'').indexOf('options.handler') > -1,'handler no args should throw due to missing handler')

  t.end();
})
