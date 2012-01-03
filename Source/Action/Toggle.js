/*
---
 
script: Toggle.js
 
description: Changes the checkedness state of a checkbox
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action
 
provides:
  - LSD.Action.Toggle
  - LSD.Action.Check
  - LSD.Action.Uncheck
 
...
*/


LSD.Action.Toggle = LSD.Action.build({
  enable: function(target) {
    if (!target || target == this.invoker || target.element == this.invoker) return;
    var widget = LSD.Module.DOM.find(target, true);
    if (widget) target = widget;
    if (!target.checked) (target.check || target.click).apply(target, Array.prototype.slice.call(arguments, 1));
  },
  
  disable: function(target) {
    if (!target || target == this.invoker || target.element == this.invoker) return;
    var widget = LSD.Module.DOM.find(target, true);
    if (widget) target = widget;
    if (target.checked) (target.uncheck || target.click).apply(target, Array.prototype.slice.call(arguments, 1));
  },
  
  getState: function(target, name, state) {
    return (state !== true && state !== false) ? !target.checked : !state;
  },

  enabler: 'check',
  disabler: 'uncheck'
});