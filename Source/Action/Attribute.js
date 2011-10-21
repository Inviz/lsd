/*
---

script: Attribute.js

description: Changes the attribute of the node

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Action

provides:
  - LSD.Action.Attribute

...
*/

LSD.Action.Attribute = LSD.Action.build({
  enable: function(target, name, value) {
    if (target.lsd) target.attributes.write(name, value);
    else target.setAttribute(name, value);
  },

  disable: function(target, name, value) {
    target.removeAttribute(name, value);
  },

  getState: function(target, name, value) {
    var old = target.attributes[name];
    if (old != null && old.nodeType) old = value.nodeValue;
    return old != null || old != value
  }
});