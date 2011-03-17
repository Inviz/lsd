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
    if (data) {
      if (data.event) data = null;
    }
    var method = target[target.submit ? 'submit' : 'send'];
    if (method) return method.call(target, data)
  }
});