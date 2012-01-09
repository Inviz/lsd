/*
---
 
script: Children.js
 
description: Makes a DOM tree like structure out of any objects
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Type
  - LSD.Script/LSD.Struct
  - LSD.Script/LSD.Array
  - LSD.Script/*
  - Core/Element

provides: 
  - LSD.Mixin.Draggable
 
...
*/

LSD.Type.Children = LSD.Struct.Array({
  exports: {
    firstChild: 'first',
    lastChild: 'last'
  }
});
LSD.Type.Children.implement({
  onSet: function(value, index, state, old) {
    if (index === 0) this.reset('first', state ? value : null);
    if (index === this.length - +state) this.reset('last', this[this.length - 1] || null);
    if (!state || this._parent != value.parentNode)
      value[state ? 'set' : 'unset']('parentNode', this._parent || null);
    var previous = this[index - 1] || null;
    var next = this[index + 1] || null;
    if (previous != value) {
      if (previous) previous.reset('nextSibling', state ? value : next);
      if (state || old === false) value.reset('previousSibling', previous);
      else if (value.previousSibling == previous) value.unset('previousSibling', previous);
    }
    if (next != value) {
      if (next) next.reset('previousSibling', state ? value : previous);
      if (state || old === false) value.reset('nextSibling', next);
      else if (value.nextSibling == next) value.unset('nextSibling', next);
    }
  },
  
  first: null,
  last: null
});
