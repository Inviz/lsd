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
  enable: function(target, e) {
    return target.submit ? target.submit() : target.send ? target.send() : null;
  }
});