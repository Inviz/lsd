/*
---
 
script: Update.js
 
description: Update widget with html or json
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action

provides:
  - LSD.Action.Update

...
*/

LSD.Action.Update = LSD.Action.build({
  enable: function(target, content) {
    if (target.empty) target.empty();
    if (content) {
      if (target.setContent) target.setContent(content);
      else target.appendChild((this.document || document).createFragment(content));
    }
    return target;
  }
});