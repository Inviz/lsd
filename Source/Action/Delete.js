/*
---

script: Delete.js

description: Deletes a widget or element

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Action

provides:
  - LSD.Action.Delete

...
*/


LSD.Action.Delete = LSD.Action.build({
  enable: function(target) {
    if (!target.lsd) {
      var widget = LSD.Module.DOM.find(target);
      LSD.Module.DOM.walk(target, function(node) {
        widget.dispatchEvent('nodeRemoved', node);
      });
      return Element.dispose(target);
    } else return (target['delete'] || target.dispose).call(target);
  }
});