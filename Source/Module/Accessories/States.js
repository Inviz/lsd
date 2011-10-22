/*
---
 
script: States.js
 
description: Define class states and methods metaprogrammatically
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD.Module
  - LSD.Script/LSD.Object
  - Ext/States
  
provides: 
  - LSD.Module.States

...
*/

LSD.Module.States = new Class({
  Implements: States,
  
  constructors: {
    states: function() {
      this.states = (new LSD.Object.Stack).addEvent('change', function(name, value, state, old, quiet) {
        var known = LSD.States[name];
        var method = value && state ? 'include' : 'erase';
        if (known && state && this.states._stack[name].length == 1) this.addState(name, null, true);
        if (!(old == null && value == null)) {
          if (LSD.Attributes[name] != 'boolean') {
            if (quiet != 'classes') this.classes[method](LSD.States[name] ? name : 'is-' + name, true);
          } else {
            if (quiet != 'attributes') this.attributes[method](name, true);
          }
          if (quiet != 'pseudos') this.pseudos[method](name, true);
        }
        if (known) {
          this.setStateTo(name, value && state, null, false);
          if (!this.states._stack[name].length) this.removeState(name, null, true);
        }
      }.bind(this))
    }
  },

  onStateChange: function(state, value, args, callback) {
    var args = Array.prototype.slice.call(arguments, 0);
    args.slice(1, 2); //state + args
    if (callback !== false) this.states[value ? 'include' : 'erase'](state);
    this.fireEvent('stateChange', [state, args]);
    return true;
  }
});

LSD.Options.states = {
  add: function(name, value) {
    this.states.set(name);
  },
  remove: function(name, value) {
    this.states.unset(name);
  },
  iterate: true
};