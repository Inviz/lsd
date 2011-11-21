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
    if (!target.lsd) target = LSD.Module.DOM.find(target);
    if (target.lsd) var element = target.element || target.toElement(), widget = target;
    else var element = target, widget = LSD.Module.DOM.find(target);
    if (before && !before.nodeType && before !== true) before = null;
    if (parent && !parent.nodeType && parent !== true) 
      parent = [widget === target ? widget.parentNode : widget, element];
    return LSD.Module.DOM.clone(target, parent, before);
  }
});