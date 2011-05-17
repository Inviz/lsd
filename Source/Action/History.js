/*
---
 
script: History.js
 
description: History Action Management.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action
  - History/History
 
provides:
  - LSD.Action.History
 
...
*/

LSD.Action.History = LSD.Action.build({
  enable: function(target, content) {
    var url = target.getAttribute('src')|| target.getAttribute('action') || target.getAttribute('href');
    History[content && typeof(content) == 'string' ? content : 'push'].apply(History, [url]);
  }
});