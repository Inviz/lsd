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
  var moving = memo & this.MOVE, splicing = memo & this.SPLICE, emptying = memo & this.FORWARD;
  var owner = this._owner
  var prev = (!state && value.previousSibling) || this[index - 1] || null, 
      next = (!state && value.nextSibling) || this[index + 1] || null;
  if (next && next === prev) next = this[index + 2] || null;
  if (owner && owner.onChildSet) owner.onChildSet.apply(owner, arguments);
  if (prev !== value && (!moving || (memo & this.FIRST && state))) {
    if (prev && (state || (!splicing || !next)))
      prev.change('nextSibling', state ? value : next, memo);
    if ((state || moving))
      value.change('previousSibling', prev, memo);
    else if (value.previousSibling == prev)
      value.unset('previousSibling', prev, memo);
  }
  if (next !== value && !moving) {
    if (next && (state || (!splicing || !prev)))
      next.change('previousSibling', state ? value : prev, memo);
    if ((state || moving))
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
    if (index === last && !moving) {
      if (state || last) owner.change('lastChild', state ? value : this[last - 1]);
      else owner.unset('lastChild', owner.lastChild);
    }
  }
  if (value.nodeType === 1 && (state || !moving)) {
    if (!state) prev = value.previousElementSibling
    else for (var i = index - 1; prev && (prev.nodeType != 1 || prev == value);) 
      prev = this[--i];
    if (!moving && (state || !splicing))
      if (!state) next = value.nextElementSibling;
      else for (var i = index + 1; next && (next.nodeType != 1 || next == value);) 
        next = this[++i];
    else next = null;
    if (prev && (!moving || old != null)) {
      if (state || moving) {
        prev.change('nextElementSibling', value, memo);
      } else if (prev.nextElementSibling === value)
        if (next) {
          if (!emptying && !splicing) prev.change('nextElementSibling', next, memo);
        } else prev.unset('nextElementSibling', value, memo);
      if (state) value.change('previousElementSibling', prev, memo);
      else if (value.previousElementSibling)
        value.unset('previousElementSibling', value.previousElementSibling, memo)
    } 
    if (next && (!state || (memo & this.LAST))) {
      if ((state && !moving) || moving) {
        next.change('previousElementSibling', value, memo);
      } else if (next.previousElementSibling === value)
        if (prev) {
          if ((state || !emptying)) next.change('previousElementSibling', prev, memo);
        } else next.unset('previousElementSibling', value, memo);
      if (state) {
        if (!moving) value.change('nextElementSibling', next, memo);
      } else if (value.nextElementSibling)
        value.unset('nextElementSibling', value.nextElementSibling, memo)
    }
  }
  if ((!state || owner != value.parentNode) && !moving)
    value[state ? 'set' : 'unset']('parentNode', owner || null, memo);
  if (owner) if (state) {
    if (index == 0) value.change('sourceIndex', (owner.sourceIndex || 0) + 1);
    else if (prev) 
      value.change('sourceIndex', (prev.sourceLastIndex || prev.sourceIndex || 0) + 1, memo);
  } else if (!moving && (state || !(memo & this.FORWARD))) 
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