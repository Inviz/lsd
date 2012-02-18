/*
---
 
script: ChildNodes.js
 
description: Makes a DOM tree like structure out of any objects
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Properties
  - LSD.Array
  - Core/Element

provides: 
  - LSD.Mixin.Draggable
 
...
*/

LSD.Properties.ChildNodes = LSD.Struct.Array({
  exports: {
    firstChild: 'first',
    lastChild: 'last'
  }
});
LSD.Properties.ChildNodes.prototype.onSet = function(value, index, state, old) {
  if (!state || this._parent != value.parentNode)
    value[state ? 'set' : 'unset']('parentNode', this._parent || null);
  var previous = this[index - 1] || null;
  var next = this[index + 1] || null;
  if (previous !== value) {
    if (previous) previous.reset('nextSibling', state ? value : next);
    if (state || old === false) value.reset('previousSibling', previous);
    else if (value.previousSibling == previous) value.unset('previousSibling', previous);
  }
  if (next !== value) {
    if (next) next.reset('previousSibling', state ? value : previous);
    if (state || old === false) value.reset('nextSibling', next);
    else if (value.nextSibling == next) value.unset('nextSibling', next);
  }
  if (this._elements !== false && value.nodeType === 1) {
    for (var i = index, node; node = this[--i];) {
      if (node === value) continue;
      if (state || old === false) node.reset('nextElementSibling', value);
      else if (node.nextElementSibling === value) node.unset('nextElementSibling', value);
      if (node.nodeType === 1) break;
    }
    for (var i = index, node; node = this[++i];) {
      if (node === value) continue;
      if (state || old === false) node.reset('previousElementSibling', value);
      else if (node.previousElementSibling === value) node.unset('previousElementSibling', value);
      if (node.nodeType === 1) break;
    }
  }
  if (!state || old === false) {
    value.unset('previousElementSibling', value.previousElementSibling);
    value.unset('nextElementSibling', value.nextElementSibling);
  }
  if (index === 0) this.reset('first', state ? value : null);
  if (index === this.length - +state) this.reset('last', this[this.length - 1] || null);
};
LSD.Properties.ChildNodes.prototype.first = null;
LSD.Properties.ChildNodes.prototype.last = null;
LSD.Properties.ChildNodes.prototype._skip = Object.append({
  _onShift: true, 
  _prefilter: true
}, LSD.Object.prototype._skip);
LSD.Properties.ChildNodes.prototype._onShift = function(index, offset, args, shift) {
  if (shift === -1 || shift === 1) {
    var arg = shift === 1 ? args[0] : this[index], children = arg.childNodes;
    if (children && children.virtual) offset += children.length;
  }
  return offset;
}
LSD.Properties.ChildNodes.Virtual = LSD.Struct.Array({
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
LSD.Properties.ChildNodes.Virtual.prototype._onShift = LSD.Properties.ChildNodes.prototype._onShift;
LSD.Properties.ChildNodes.Virtual.prototype.onSet = function(value, index, state, old) {
  if (old != null) return;
  var subject = (this._parent || this)
  var parent = subject.parentNode;
  if (!parent) return;
  if (value.childNodes && value.childNodes.virtual)
    value.childNodes[state ? 'set' : 'unset']('parentNode', subject) 
  if (parent.insertBefore) {
    if (!state) parent.removeChild(value);
    else parent.insertBefore(value, (this[index - 1] || subject).nextSibling)
  } else {
    var children = parent.childNodes;
    if (!state) children.splice(children.indexOf(value), 1)
    else children.splice(children.indexOf((this[index - 1] || subject).nextSibling), 0, value);
  }
};
LSD.Properties.ChildNodes.Virtual.prototype.virtual = true;