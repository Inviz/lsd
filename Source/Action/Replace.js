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
    var widget = target.localName ? Element.get(target, 'widget') : target.parentNode;
		var fragment = document.createFragment(content);
    var children = Array.prototype.slice.call(fragment.childNodes, 0);
    if (content) target.parentNode.replaceChild(fragment, target);
    if (widget.layout) widget.layout.render(children, widget, 'augment');
  }
});