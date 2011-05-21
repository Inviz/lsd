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
    if (!target.checked) (target.check || target.click).apply(target, Array.prototype.slice.call(arguments, 1));
  },
  
  disable: function(target) {
    if (!target || target == this.caller || target.element == this.caller) return;
    if (target.checked) (target.uncheck || target.click).apply(target, Array.prototype.slice.call(arguments, 1));
  },
  
  getState: function(target, state) {
    switch (state) {
      case true: case "true": state = true; break;
      case false: case "false": state = false; break;
    };
    return (state !== true && state !== false) ? !this.caller.checked : !state;
  }
});