/*
---
 
script: Scroll.js
 
description: Scroll to target
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action
  - Core/Element.Dimensions
 
provides:
  - LSD.Action.Scroll
 
...
*/


LSD.Action.Scroll = LSD.Action.build({
  enable: function(target) {
    var position = target.getPosition();
    document.body.scrollTo(position.x, position.y - 100);
  }
});