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
    var widget = target.localName ? Element.get(target, 'widget') : target;
    var fragment = document.createFragment(content);
    var children = Array.prototype.slice.call(fragment.childNodes, 0);
    document.id(target).empty().appendChild(fragment);
    if (widget.layout) widget.layout.augment(children, widget);
  }
});