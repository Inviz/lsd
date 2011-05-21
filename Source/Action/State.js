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
    if (target.lsd) {
      if (target.$states[name]) target.setStateTo(name, true);
      else target.addPseudo(name);
    } else target.addClass(name);
  },
  
  disable: function(target, name) {
    if (target.lsd) {
      if (target.$states[name]) target.setStateTo(name, false);
      else target.removePseudo(name);
    } else target.removeClass(name);
  },
  
  getState: function(target, name, state) {
    if (state === true || state === false) return state;
    if (target.lsd) {
      if (target.$states[name]) return target[name];
      else return target.pseudos[name];
    } else return target.hasClass(name);
  }
});