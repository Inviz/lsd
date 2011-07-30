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
  enable: function(target, before) {
    var widget = LSD.Module.DOM.find(target);
    if ((target.lsd ? widget : widget.element) == target) 
      var element = widget.element, parent = widget.parentNode;
    else 
      var element = target, parent = widget;
    var hook = before === true ? element : element.nextSibling;
    var clone = widget.layout.render(element, [parent, element.parentNode], {clone: true}, {before: hook});
  }
});