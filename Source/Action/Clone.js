/*
---
 
script: Clone.js
 
description: Clones an element and inserts it back to parent again
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action
 
provides:
  - LSD.Action.Clone
 
...
*/


LSD.Action.Clone = LSD.Action.build({
  enable: function(target, parent, before) {
    if (before && !before.nodeType && before !== true) before = null;
    if (parent && !parent.nodeType && parent !== true) parent = null;
    return LSD.Module.DOM.clone(target, parent, before);
  }
});