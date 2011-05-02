/*
---
 
script: Replace.js
 
description: Replaces one widget with another
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action
 
provides:
  - LSD.Action.Replace
 
...
*/


LSD.Action.Replace = LSD.Action.build({
  enable: function(target, content) {
    var widget = LSD.Module.DOM.find(target);
    if (widget == target) widget = widget.parentNode;
		var fragment = document.createFragment(content);
    var children = Array.prototype.slice.call(fragment.childNodes, 0);
    if (content) target.parentNode.replaceChild(fragment, target);
    widget.fireEvent('DOMNodeInserted', children);
  }
});