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
    target.dispose();
    if (target.getModel) return target.getModel()['new']()
  }
});