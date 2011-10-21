/*
---

script: Focus.js

description: Brings attention to element

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Action

provides:
  - LSD.Action.Focus

...
*/

LSD.Action.Focus = LSD.Action.build({
  enable: function(target) {
    return (target.focus || target.click).apply(target, Array.prototype.slice(arguments, 1));
  },

  disable: function(target) {
    if (target.blur) return target.blur();
  }
})