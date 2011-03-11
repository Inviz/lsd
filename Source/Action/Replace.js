/*
---
 
script: Replace.js
 
description: Replaces one widget with another
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action
 
provides:
  - LSD.Action.Replace
 
...
*/


LSD.Action.Replace = LSD.Action.build({
  enable: function(target, content) {
    if (content) target.parentNode.replaceChild((this.document || document).createFragment(content), target);
  }
});