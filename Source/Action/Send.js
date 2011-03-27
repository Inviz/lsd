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
  enable: function(target, data, callback) {
    return (target.submit || target.send).apply(target, Array.prototype.slice.call(arguments, 0));
  }
});