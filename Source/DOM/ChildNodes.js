/*
---

script: ChildNodes.js

description: Makes a DOM tree like structure out of any objects

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Properties
  - LSD.Array

provides:
  - LSD.ChildNodes

...
*/

LSD.ChildNodes = LSD.Struct({
  _owner: function(value, old) {
    if (old && this._length) {
      old.unset('firstChild', this[0]);
      old.unset('lastChild', this[this.length - 1]);
    }
  }
}, 'Array');
LSD.ChildNodes.prototype.onSet = function(value, index, state, old, memo) {
  var owner = this._owner
  if ((!state || owner != value.parentNode) && memo !== 'collapse')
    value[state ? 'set' : 'unset']('parentNode', owner || null, memo);
  var previous = this[index - 1] || null, next = this[index + 1] || null;
  if (next && next === previous) next = this[index + 2] || null;
  if (previous !== value && memo !== 'collapse') {
    if (previous && (memo !== 'splice' || (!state && !next)))
      previous.change('nextSibling', state ? value : next, memo);
    if ((state || old === false))
      value.change('previousSibling', previous, memo);
    else if (value.previousSibling == previous)
      value.unset('previousSibling', previous, memo);
  }
  if (next !== value && memo !== 'collapse') {
    if (next && (memo !== 'splice' || (!state && !previous))) {
      next.change('previousSibling', state ? value : previous, memo);
    }
    if ((state || old === false))
      value.change('nextSibling', next, memo);
    else if (value.nextSibling == next)
      value.unset('nextSibling', next, memo);
  }
  if (owner) {
    if (index === 0) {
      if (state) owner.change('firstChild', value);
      else owner.unset('firstChild', owner.firstChild);
    }
    var last = this.length - +state;
    if (index === last && memo !== 'collapse') {
      if (state || last) owner.change('lastChild', state ? value : this[last - 1]);
      else owner.unset('lastChild', owner.lastChild);
    }
    if (this._owner.onChildSet) this._owner.onChildSet.apply(this._owner, arguments);
  }
  
  if (owner) if (state) {
    if (index == 0) value.change('sourceIndex', (owner.sourceIndex || 0) + 1);
    else if (previous) 
      value.change('sourceIndex', (previous.sourceLastIndex || previous.sourceIndex || 0) + 1, memo);
  } else if (memo !== 'empty' && memo !== 'collapse') 
      value.unset('sourceIndex', value.sourceIndex, memo);
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
LSD.ChildNodes.Virtual = LSD.Struct({
  imports: {
    parentNode: '.parentNode'
  },
  parentNode: function(node, old) {
    var children = (node || old).childNodes;
    var index = children.indexOf(this._owner || this);
    if (node) {
      var args = [index + 1, 0];
      for (var i = 0, child; child = this[i++];) args.push(child)
      children.splice.apply(children, args);
    }
  }
}, 'Array');
LSD.ChildNodes.Virtual.prototype.virtual = true;
LSD.ChildNodes.Virtual.prototype._onShift = LSD.ChildNodes.prototype._onShift;
LSD.ChildNodes.Virtual.prototype.onSet = function(value, index, state, old) {
  if (old != null) return;
  var subject = (this._owner || this)
  var parent = subject.parentNode;
  if (!parent) {
    if (value.virtual)
      if (state) value.set('parentNode', subject);
      else if (value.parentNode == subject)
        value.unset('parentNode', subject);
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