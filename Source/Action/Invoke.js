/*
---
 
script: Invoke.js
 
description: Invokes a widget and breaks execution chain
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action
 
provides:
  - LSD.Action.p
 
...
*/


LSD.Action.Invoke = LSD.Action.build({
  enable: function(target) {
    var widget = LSD.Module.DOM.find(target);
    this.store(target, widget);
    var result = widget.invoke.apply(widget, [this.invoker].concat(Array.slice(arguments, 1)));
    return (result === true || result === false || result == widget) ? false : result;
  },
  
  disable: function(target) {
    var invokee = this.retrieve(target);
    if (invokee) invokee.revoke();
  }
});