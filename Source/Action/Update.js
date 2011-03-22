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
    if (target.document) {
      var widget = target;
      target = widget.element
    } else {
      var widget = Element.get(target, 'widget');
    }
    if (target.empty) target.empty();
    var fragment = document.createFragment(content);
    var children = Array.from(fragment.childNodes);
    target.appendChild(fragment);
    if (widget.layout) widget.layout.render(children, widget);
    return target;
  }
});