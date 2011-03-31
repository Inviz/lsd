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
    if (target.localName) {
      var widget = target.get('widget');
      this.options.walk.call(this, target, function(node) {
        widget.dispatchEvent('nodeRemoved', node);
      })
    }
    target.dispose();
    if (target.getModel) return target.getModel()['delete']()
  },
  
  walk: function(element, callback) {
    for (var node = element.firstChild; node; node = node.nextSibling) {
      if (node.nodeType != 1) continue;
      var widget = node.uid && node.retrieve('widget');
      if (widget) widget.walk(callback);
      else this.options.walk.call(this, node, callback)
    }
  }
});