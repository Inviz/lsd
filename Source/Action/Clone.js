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
  enable: function(target, where) {
    var widget = LSD.Module.DOM.find(target);
    if (widget == target) var element = widget.element, parent = widget.parentNode;
    else var element = target, parent = widget;
    var clone = widget.layout.render(element, parent, {clone: true});
    switch(where) {
      case "before": case "after": case "top": case "bottom":
        break;
      default:
        where = 'after'
    };
    document.id(clone).inject(target, where);
  }
});