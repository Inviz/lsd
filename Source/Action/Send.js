/*
---
 
script: Send.js
 
description: Does a request or navigates url to the link
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD
 
provides: 
  - LSD.Action
 
...
*/


LSD.Action.Send = new LSD.Action({
  enable: function(target) {
    return target.submit ? target.submit() : target.send ? target.send() : null;
  }
})