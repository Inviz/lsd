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
  enable: function(content) {
    if (this.empty) this.empty();
    if (this.setContent) this.setContent(content)
    else if (this.set) this.set('html', content)
    return this;
  }
});