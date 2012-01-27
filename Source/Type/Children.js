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

LSD.Type.ChildNodes = LSD.Type.Children = LSD.Struct.Array({
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
LSD.Type.Children.prototype._onShift = function(index, offset, args, shift) {
  if (shift === -1 || shift === 1) {
    var arg = shift === 1 ? args[0] : this[index], children = arg.childNodes;
    if (children && children.virtual) offset += children.length;
  }
  return offset;
}

LSD.Type.Children.Virtual = LSD.Struct.Array({
  imports: {
    parentNode: '.parentNode'
  },
  parentNode: function(node, old) {
    var children = (node || old).childNodes;
    var index = children.indexOf(this._parent);
    if (node) {
      var args = [index + 1, 0];
      for (var i = 0, child; child = this[i++];) args.push(child)
      children.splice.apply(children, args);
    }
  }
});
LSD.Type.Children.Virtual.prototype._onShift = LSD.Type.Children.prototype._onShift;
LSD.Type.Children.Virtual.prototype.onSet = function(value, index, state, old) {
  if (old != null) return;
  var parent = this._parent.parentNode;
  if (!parent) return;
  if (value.childNodes && value.childNodes.virtual)
    value.childNodes[state ? 'set' : 'unset']('parentNode', this._parent) 
  if (parent.insertBefore) {
    if (!state) parent.removeChild(value);
    else parent.insertBefore(value, (this[index - 1] || this._parent).nextSibling)
  } else {
    var children = parent.childNodes;
    if (!state) children.splice(children.indexOf(value), 1)
    else children.splice(children.indexOf((this[index - 1] || this._parent).nextSibling), 0, value);
  }
};
LSD.Type.Children.Virtual.prototype.virtual = true;