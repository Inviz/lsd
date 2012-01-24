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
    var parent      = this._parent, 
        stack       = this._stack[name],
        ns          = parent.namespace || LSD,
        states      = ns.states,
        compiled    = states._compiled || (states._compiled = {}),
        definition  = states[name],
        substate    = value && state;
    if (definition && state && stack.length === 1 && typeof parent[definition[0]] != 'function')
      parent.mix(compiled[name] || (compiled[name] = LSD.Type.States.compile(name, ns, definition)));
    if (value || old) {
      if ((ns.attributes[name]) !== Boolean) {
        if (memo !== 'classes')
          parent.mix('classes.' + (definition ? name : 'is-' + name), true, null, substate);
      } else {
        if (memo !== 'attributes') 
          parent.mix('attributes.' + name, true, null, substate);
      }
      if (memo !== 'pseudos')
        parent.mix('pseudos.' + name, true, null, substate);
    }
    if (definition) {
      if (state) parent.reset(name, value);
      else parent.unset(name, value);
      if (stack.length === 0)
        parent.mix(states._compiled[name], null, memo, false);
    }
    return value;
  }
});
LSD.Type.States.compile = function(name, ns, definition) {
  var obj = {};
  obj[definition[0]] = function() {
    return this.mix('states.' + name, true, 'reset');
  };
  obj[definition[1]] = function() {
    return this.mix('states.' + name, false, 'reset');
  };
  return obj;
};