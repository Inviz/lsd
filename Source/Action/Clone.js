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
  enable: function(target) {
    var widget = LSD.Module.DOM.find(target);
    if (widget == target) var element = widget.element, parent = widget.parentNode;
    else var element = target, parent = widget;
    var clone = this.root.layout.element(element, parent, {clone: true});
    (clone.toElement ? clone.toElement() : clone).inject(target, 'after');
  }
});