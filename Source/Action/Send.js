/*
---
 
script: Send.js
 
description: Does a request or navigates url to the link
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action
 
provides:
  - LSD.Action.Send
 
...
*/


LSD.Action.Send = LSD.Action.build({
  enable: function(target, data) {
    var method = target.submit ? 'submit' : 'send';
    if (method) return target[method].call(target, data, this.caller.kick.bind(this.caller));
  },
  
  asynchronous: true
});