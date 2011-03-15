/*
---
 
script: Check.js
 
description: Changes the state of a widget
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action
 
provides:
  - LSD.Action.Check
 
...
*/


LSD.Action.Check = LSD.Action.build({
  enable: function(target) {
    if (!target || target == this.caller || target.element == this.caller) return;
    if (!target.checked) target.click.apply(target, Array.prototype.splice.call(arguments, 1));
  },
  
  disable: function(target) {
    if (!target || target == this.caller || target.element == this.caller) return;
    if (target.checked) target.click.apply(target, Array.prototype.splice.call(arguments, 1));
  },
  
  getState: function(target, state) {
    return !(state == null ? this.caller.checked : state);
  }
});