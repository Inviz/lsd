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
    var children = Array.prototype.slice.call(fragment.childNodes, 0);
    document.id(target).appendChild(fragment);
    if (widget.layout) widget.layout.augment(children, widget);
  }
});