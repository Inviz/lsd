/*
---
 
script: Actions.js
 
description: Assign functions asyncronously to any widget
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Module
  - LSD.Action

provides: 
  - LSD.Module.Actions
 
...
*/

LSD.Module.Actions = new Class({
  constructors: {
    actions: function() {
      this.actions = {}
    }
  },
  
  addAction: function() {
    this.getAction.apply(this, arguments).attach(this);
  },
  
  removeAction: function() {
    this.getAction.apply(this, arguments).detach(this);
  },
  
  getAction: function(name, action) {
    return this.actions[name] || (this.actions[name] = new (LSD.Action[LSD.capitalize(name)] || LSD.Action)(action, name))
  },
  
  getActionState: function(action, args, state, revert) {
    if (state == null) {
      if (action.options.getState) state = action.options.getState.apply(action, args);
      else state = true; //enable things by default
    }
    return !!((state && state.call ? state.apply(this, args) : state) ^ revert);
  }
});

LSD.Options.actions = {
  add: 'addAction',
  remove: 'removeAction',
  iterate: true
};