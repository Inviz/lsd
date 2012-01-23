/*
---
 
script: States.js
 
description: Define class states and methods metaprogrammatically
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD.Type
  - LSD.Object.Stack
  - LSD.Struct
  
provides: 
  - LSD.Type.States

...
*/

LSD.mix('states', {
  built:    ['build',      'destroy'],
  attached: ['attach',     'detach'],
  hidden:   ['hide',       'show'],
  disabled: ['disable',    'enable'],
  active:   ['activate',   'deactivate'],
  focused:  ['focus',      'blur'],     
  selected: ['select',     'unselect'], 
  chosen:   ['choose',     'forget'],
  checked:  ['check',      'uncheck'],
  collapsed:['collapse',   'expand'],
  started:  ['start',      'finish'],
  empty:    ['unfill',     'fill'],
  invalid:  ['invalidate', 'validate'],
  editing:  ['edit',       'save'],
  placeheld:['placehold',  'unplacehold'],
  invoked:  ['invoke',     'revoke']
});

LSD.Type.States = LSD.Struct.Stack();
LSD.Type.States.implement({
  onChange: function(name, value, state, old, memo) {
    var ns = this._parent.namespace || LSD;
    var known = ns.states[name];
    var method = value && state ? 'set' : 'unset';
    if (known && state && this._stack[name].length === 1)
      this._parent.mix(ns.states._compiled && ns.states._compiled[name] || LSD.Type.States.compile(name, ns));
    if (value || old) {
      if ((ns.attributes[name]) !== Boolean) {
        if (memo != 'classes')
          this._parent[method]('classes.' + (known ? name : 'is-' + name), true);
      } else {
        if (memo != 'attributes') 
          this._parent[method]('attributes.' + name, true);
      }
      if (memo != 'pseudos')
        this._parent[method]('pseudos.' + name, true);
    }
    if (known) {
      if (state) this._parent.reset(name, value);
      else this._parent.unset(name, value);
      if (this._stack[name].length === 0) 
        this._parent.mix(ns.states._compiled[name], null, memo, false);
    }
    return value;
  }
});
LSD.Type.States.compile = function(name, ns) {
  var compiled = (ns.states._compiled || (ns.states._compiled = {}));
  if (!compiled[name]) {
    var definition = ns.states[name];
    if (definition) {
      compiled[name] = {};
      compiled[name][definition[0]] = function() {
        return this.mix('states.' + name, true, 'reset');
      };
      compiled[name][definition[1]] = function() {
        return this.mix('states.' + name, false, 'reset');
      };
    }
  }
  return compiled[name];
};