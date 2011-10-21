/*
---

script: List.js

description: Shows or hides things

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Action

provides:
  - LSD.Action.List
  - LSD.Action.Next
  - LSD.Action.Previous

...
*/

LSD.Action.List = LSD.Action.build({
  enable: function(target) {
    var widget = LSD.Module.DOM.find(target, true);
    if (widget && widget.pseudos.list) widget.next();
  },

  disable: function(target) {
    var widget = LSD.Module.DOM.find(target, true);
    if (widget && widget.pseudos.list) widget.previous();
  },

  getState: function(target, state) {
    return state == 'true';
  },

  enabler: 'next',
  disabler: 'previous'
});