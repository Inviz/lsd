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
    if (target.localName) var widget = target.get('widget'), element = target, parent = widget;
    else var widget = target, element = widget.element, parent = widget.parentNode;
    var clone = this.document.layout.render(element, parent, 'clone');
    (clone.toElement ? clone.toElement() : clone).inject(target, 'after');
  }
});