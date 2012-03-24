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
  - LSD.ChildNodes
 
...
*/

LSD.ChildNodes = LSD.Struct.Array({
  _parent: function(value, old) {
    if (old && this._length) {
      old.unset('firstChild', this[0]);
      old.unset('lastChild', this[this.length - 1]);
    }
  }
});
LSD.ChildNodes.prototype.onSet = function(value, index, state, old, memo) {
  if (!state || this._parent != value.parentNode)
    value[state ? 'set' : 'unset']('parentNode', this._parent || null, memo);
  var previous = this[index - 1] || null;
  var next = this[index + 1] || null;
  if (previous !== value && memo !== 'collapse') {
    if (previous && (memo !== 'splice' || (!state && !next))) previous.reset('nextSibling', state ? value : next, memo);
    if ((state || old === false)) value.reset('previousSibling', previous, memo);
    else if (value.previousSibling == previous) value.unset('previousSibling', previous, memo);
  }
  if (next !== value && memo !== 'collapse') {
    if (next && (memo !== 'splice' || (!state && !previous))) next.reset('previousSibling', state ? value : previous, memo);
    if ((state || old === false)) value.reset('nextSibling', next, memo);
    else if (value.nextSibling == next) value.unset('nextSibling', next, memo);
  }
  if (this._elements !== false && value.nodeType === 1) {
    for (var i = index, node; node = this[--i];) {
      if (node === value) continue;
      if (state || old === false) node.reset('nextElementSibling', value, memo);
      else if (node.nextElementSibling === value) node.unset('nextElementSibling', value, memo);
      if (node.nodeType === 1) break;
    }
    for (var i = index, node; node = this[++i];) {
      if (node === value) continue;
      if (state || old === false) node.reset('previousElementSibling', value, memo);
      else if (node.previousElementSibling === value) node.unset('previousElementSibling', value, memo);
      if (node.nodeType === 1) break;
    }
  }
  if (!state || old === false) {
    value.unset('previousElementSibling', value.previousElementSibling);
    value.unset('nextElementSibling', value.nextElementSibling);
  }
  if (this._parent) {
    if (index === 0) {
      if (state) this._parent.reset('firstChild', value);
      else this._parent.unset('firstChild', this._parent.firstChild);
    }
    var last = this.length - +state;
    if (index === last && memo !== 'collapse') {
      if (state || last) this._parent.reset('lastChild', state ? value : this[last - 1]);
      else this._parent.unset('lastChild', this._parent.lastChild);
    }
    if (this._parent.onChildSet) this._parent.onChildSet.apply(this._parent, arguments);
  }
};
LSD.ChildNodes.prototype._skip = Object.append({
  _onShift: true, 
  _prefilter: true
}, LSD.Object.prototype._skip);
LSD.ChildNodes.prototype._onShift = function(index, offset, args, shift) {
  if (shift === -1 || shift === 1) {
    var arg = shift === 1 ? args[0] : this[index], children = arg.childNodes;
    if (children && children.virtual) offset += children.length;
  }
  return offset;
}
LSD.ChildNodes.Virtual = LSD.Struct.Array({
  imports: {
    parentNode: '.parentNode'
  },
  parentNode: function(node, old) {
    var children = (node || old).childNodes;
    var index = children.indexOf(this._parent || this);
    if (node) {
      var args = [index + 1, 0];
      for (var i = 0, child; child = this[i++];) args.push(child)
      children.splice.apply(children, args);
    }
  }
});
LSD.ChildNodes.Virtual.prototype.virtual = true;
LSD.ChildNodes.Virtual.prototype._onShift = LSD.ChildNodes.prototype._onShift;
LSD.ChildNodes.Virtual.prototype.onSet = function(value, index, state, old) {
  if (old != null) return;
  var subject = (this._parent || this)
  var parent = subject.parentNode;
  if (!parent) {
    if (value.virtual) 
      if (state) value.set('parentNode', subject);
      else if (value.parentNode == subject) value.unset('parentNode', subject);
    return
  };
  if (value.childNodes && value.childNodes.virtual)
    value.childNodes[state ? 'set' : 'unset']('parentNode', subject);
  if (parent.insertBefore) {
    if (!state) 
      parent.removeChild(value);
    else if (parent.childNodes.indexOf(value) == -1) 
      parent.insertBefore(value, (this[index - 1] || subject).nextSibling)
  } else {
    var children = parent.childNodes;
    if (!state) 
      children.splice(children.indexOf(value), 1)
    else if (children.indexOf(value) == -1)
      children.splice(children.indexOf((this[index - 1] || subject).nextSibling), 0, value);
  }
};
LSD.Properties.ChildNodes = LSD.ChildNodes;