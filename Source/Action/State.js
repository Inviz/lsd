/*
---
 
script: State.js
 
description: Changes the state of a widget
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action
 
provides:
  - LSD.Action.State
 
...
*/

LSD.Action.State = LSD.Action.build({
  enable: function(target, name) {
    target.addClass(name);
  },
  
  disable: function(target, name) {
    target.removeClass(name);
  },
  
  getState: function(target, name, state) {
    return (state !== true && state !== false) ? target.hasClass(name) : state;
  }
});