/*
---
 
script: States.js
 
description: Define class states and methods metaprogrammatically
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD.Module
  - LSD.Script/LSD.Object.Stack
  - Ext/States
  
provides: 
  - LSD.Module.States

...
*/

!function(States) {
  LSD.States = Object.append({
    built:    ['build',      'destroy'],
    attached: ['attach',     'detach'],
    hidden:   ['hide',       'show'],
    disabled: ['disable',    'enable'],
    active:   ['activate',   'deactivate'],
    focused:  ['focus',      'blur'],     
    selected: ['select',     'unselect'], 
    checked:  ['check',      'uncheck'],
    collapsed:['collapse',   'expand'],
    working:  ['busy',       'idle'],
    chosen:   ['choose',     'forget'],
    empty:    ['empty',      'fill'],
    invalid:  ['invalidate', 'unvalidate'],
    valid:    ['validate',   'unvalidate'],
    editing:  ['edit',       'finish'],
    placeheld:['placehold',  'unplacehold'],
    invoked:  ['invoke',     'revoke']
  }, States);
  
  LSD.Module.States = LSD.Struct.Stack();
  LSD.Module.States.prototype.onChange = function(name, value, state, old) {
    var known = LSD.States[name];
    var method = value && state ? 'include' : 'erase';
    if (known && state && this._stack[name].length == 1) this._widget.merge(LSD.Module.States.getState(name));
    if (!(old == null && value == null)) {
      if (LSD.Attributes[name] != 'boolean') {
        if (quiet != 'classes') this._widget.classes[method](LSD.States[name] ? name : 'is-' + name, true);
      } else {
        if (quiet != 'attributes') this._widget.attributes[method](name, true);
      }
      if (quiet != 'pseudos') this._widget.pseudos[method](name, true);
    }
    if (known) {
      this._widget[state ? 'set' : 'unset'](name, value);
      if (!this._stack[name].length) this._widget.unmerge(LSD.Module.States.getState(name));
    }
  };
  var Compiled = {};
  LSD.Module.States.getState = function(name) {
    if (!Compiled[name]) {
      var definition = States[name];
      if (definition) {
        Compiled[name] = {};
        Compiled[name][definition[0]] = function() {
          return this.states.set(name, true)
        };
        Compiled[name][definition[1]] = function() {
          return this.states.set(name, false)
        };
      }
    }
    return Compiled[name];
  };
  
}(LSD.States || (LSD.States = {}))