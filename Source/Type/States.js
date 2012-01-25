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
  onChange: function(key, value, state, old, memo) {
    var parent      = this._parent, 
        stack       = this._stack[key],
        ns          = parent.keyspace || LSD,
        states      = ns.states,
        compiled    = states._compiled || (states._compiled = {}),
        definition  = states[key],
        substate    = value && state;
    if (definition && state && stack.length === 1 && typeof parent[definition[0]] != 'function')
      parent.mix(compiled[key] || (compiled[key] = LSD.Type.States.compile(key, ns, definition)));
    if (value || old) {
      if ((ns.attributes[key]) !== Boolean) {
        if (memo !== 'classes' && parent.classes)
          parent.classes[substate ? 'set' : 'unset']((definition ? key : 'is-' + key), true, 'states');
      } else {
        if (memo !== 'attributes' && parent.attributes) 
          parent.attributes[substate ? 'set' : 'unset'](key, substate ? true : undefined, 'states');
      }
      if (memo !== 'pseudos' && parent.pseudos)
        parent.pseudos[substate ? 'set' : 'unset'](key, true, 'states');
    }
    if (definition) {
      if (state) parent.reset(key, value);
      else parent.unset(key, value);
      if (stack.length === 0)
        parent.mix(states._compiled[key], null, 'states', false);
    }
    return value;
  }
});
LSD.Type.States.compile = function(key, ns, definition) {
  var obj = {};
  obj[definition[0]] = function() {
    return this.states.reset(key, true);
  };
  obj[definition[1]] = function() {
    return this.states.reset(key, false);
  };
  return obj;
};