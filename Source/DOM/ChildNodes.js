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
LSD.ChildNodes.prototype.onSet = function(value, index, state, old, meta) {
  var moving = meta & this.MOVE, splicing = meta & this.SPLICE, emptying = meta & this.FORWARD;
  var owner = this._owner
  var prev = (!state && value.previousSibling) || this[index - 1] || null, 
      next = (!state && value.nextSibling) || this[index + 1] || null;
  if (next === prev && next) next = this[index + 2] || null;
  if (owner && owner.onChildSet) owner.onChildSet.apply(owner, arguments);
  if (prev !== value && (!moving || (state && (meta & this.FIRST)))) {
    if (prev && (state || (!splicing || !next)))
      prev.change('nextSibling', state ? value : next, meta);
    if ((state || moving))
      value.change('previousSibling', prev, meta);
    else if (value.previousSibling == prev)
      value.unset('previousSibling', prev, meta);
  }
  if (next !== value && !moving) {
    if (next && (state || (!splicing || !prev)))
      next.change('previousSibling', state ? value : prev, meta);
    if ((state || moving))
      value.change('nextSibling', next, meta);
    else if (value.nextSibling == next)
      value.unset('nextSibling', next, meta);
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
    if (!state) 
      prev = value.previousElementSibling
    else for (var i = index - 1; prev && (prev.nodeType != 1 || prev == value);) 
      prev = this[--i];
    if (!moving && (state || !splicing))
      if (!state) 
        next = value.nextElementSibling;
      else for (var i = index + 1; next && (next.nodeType != 1 || next == value);) 
        next = this[++i];
    else next = null;
    if (prev && (!moving || old != null)) {
      if (state || moving) {
        prev.change('nextElementSibling', value, meta);
      } else if (prev.nextElementSibling === value)
        if (next) {
          if (!emptying && !splicing) 
            prev.change('nextElementSibling', next, meta);
        } else 
          prev.unset('nextElementSibling', value, meta);
      if (state) 
        value.change('previousElementSibling', prev, meta);
      else if (value.previousElementSibling)
        value.unset('previousElementSibling', value.previousElementSibling, meta)
    } 
    if (next && (!state || (meta & this.LAST))) {
      if ((state && !moving) || moving) {
        next.change('previousElementSibling', value, meta);
      } else if (next.previousElementSibling === value)
        if (prev) {
          if ((state || !emptying)) 
            next.change('previousElementSibling', prev, meta);
        } else 
          next.unset('previousElementSibling', value, meta);
      if (state) {
        if (!moving) value.change('nextElementSibling', next, meta);
      } else if (value.nextElementSibling)
        value.unset('nextElementSibling', value.nextElementSibling, meta)
    }
  }
  if ((!state || owner != value.parentNode) && !moving)
    value[state ? 'set' : 'unset']('parentNode', owner || null, meta);
  if (owner) if (state) {
    if (index == 0) 
      value.change('sourceIndex', (owner.sourceIndex || 0) + 1);
    else if (prev) 
      value.change('sourceIndex', (prev.sourceLastIndex || prev.sourceIndex || 0) + 1, meta);
  } else if (!moving && (state || !(meta & this.FORWARD))) 
      value.unset('sourceIndex', value.sourceIndex, meta);
};
LSD.ChildNodes.prototype._onSplice = function(value, args) {
  var children = value.childNodes;
  if (value.nodeType == 7 && !value.value) return;
  if (children && children.virtual) {
    for (var i = 0, result = [], node; node = children[i++];) {
      for (var frag = node; frag = frag.fragment;)
        if (frag.nodeType == 7 && !frag.value) break;
      if (!frag && args.indexOf(node) == -1 && this._prefilter(node)) 
        result.push(node);
    }
    return result;
  }
};
LSD.ChildNodes.prototype._prefilter = function(node) {
  if (!this.virtual) {
    for (var frag = node; frag = frag.fragment;)
      if (frag.nodeType == 7 && !frag.value) break;
    if (frag) return false;
  }
  var owner = this._owner;
  if (owner && owner.proxies && !owner.proxies._bouncer(node))
    return false;
  if (node.nodeType == 7 && owner && !this.virtual) {
    node.set('parentNode', owner, 'push')
  }
  return true;
};
LSD.ChildNodes.Virtual = LSD.Struct({
  imports: {
    parentNode: '.parentNode'
  }
}, 'Array');
LSD.ChildNodes.Virtual.prototype.virtual = true;
LSD.ChildNodes.Virtual.prototype._onSplice = LSD.ChildNodes.prototype._onSplice;
LSD.ChildNodes.Virtual.prototype._prefilter = LSD.ChildNodes.prototype._prefilter;
LSD.ChildNodes.Virtual.prototype.onSet = function(value, index, state, old, meta) {
  if (meta & this.MOVE) return;
  var subject = (this._owner || this);
  var parent = subject.parentNode;
  if (!parent) {
    if (value.virtual)
      if (state) 
        value.set('parentCollection', subject);
      else if (value.parentCollection == subject)
        value.unset('parentCollection', subject);
    if (!(parent = this.parentCollection)) return;
  };
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