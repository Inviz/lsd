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
    var widget = LSD.Module.DOM.find(target);
    var fragment = document.createFragment(content);
    var children = LSD.slice(fragment.childNodes);
    document.id(target).empty().appendChild(fragment);
    widget.fireEvent('DOMNodeInserted', [children]);
  }
});