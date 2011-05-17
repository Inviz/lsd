/*
---
 
script: Append.js
 
description: Append some content to widget
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action

provides:
  - LSD.Action.Append

...
*/

LSD.Action.Append = LSD.Action.build({
  enable: function(target, content) {
    var widget = LSD.Module.DOM.find(target);
    var fragment = document.createFragment(content);
    var children = LSD.slice(fragment.childNodes);
    document.id(target).appendChild(fragment);
    widget.fireEvent('DOMNodeInserted', [children]);
  }
});