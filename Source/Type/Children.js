/*
---
 
script: Children.js
 
description: Makes a DOM tree like structure out of any objects
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Type
  - LSD.Array
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
LSD.Type.Children.prototype.onSet = function(value, index, state, old) {
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
  if (index === 0) this.reset('first', state ? value : null);
  if (index === this.length - +state) this.reset('last', this[this.length - 1] || null);
};
LSD.Type.Children.prototype.first = null;
LSD.Type.Children.prototype.last = null;

LSD.Type.Children.Virtual = LSD.Struct.Array({
  imports: {
    parentNode: '.parentNode',
    previousSibling: '.previousSibling'
  },
  
  parentNode: function(node) {
    var children = node.childNodes;
    var index = children.indexOf(this._parent);
    var args = [index + 1, 0];
    for (var i = 0, j = this.childNodes.length; i < j; i++) args.push(this.childNodes[i])
    children.splice.apply(children, args);
  }
});
LSD.Type.Children.Virtual.prototype.onSet = function(value, index, state, old) {
  if (old == null) {
    if (this.parentNode)
      if (state)
        this.parentNode.insertBefore(value, (this[this.length - 1] || this._parent).nextSibling)
      else
        this.parentNode.removeChild(value);
  }
}
LSD.Type.Children.Virtual = LSD.Struct.Array({
  
});