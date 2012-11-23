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
      old.set('firstChild', undefined, this[0]);
      old.set('lastChild', undefined, this[this.length - 1]);
    }
  }
}, 'Array');
LSD.ChildNodes.prototype.onSet = function(index, value, old, meta, from) {
  var moving = meta & this.MOVE, splicing = meta & this.SPLICE, emptying = meta & this.FORWARD;
  var node = value || old, state = !!value, owner = this._owner
  var prev = (!state && node.previousSibling) || this[index - 1] || null, 
      next = (!state && node.nextSibling) || this[index + 1] || null;
  if (next === prev && next) next = this[index + 2] || null;
  if (owner && owner.onChildSet) owner.onChildSet.apply(owner, arguments);
  if (prev !== node && (!moving || (state && (meta & this.FIRST)))) {
    if (prev && (state || (!splicing || !next)))
      prev.change('nextSibling', state ? node : next, undefined, meta);
    if ((state || moving))
      node.change('previousSibling', prev, undefined, meta);
    else if (node.previousSibling == prev)
      node.set('previousSibling', undefined, prev, meta);
  }
  if (next !== node && !moving) {
    if (next && (state || (!splicing || !prev)))
      next.change('previousSibling', state ? node : prev, undefined, meta);
    if ((state || moving))
      node.change('nextSibling', next, undefined, meta);
    else if (node.nextSibling == next)
      node.set('nextSibling', undefined, next, meta);
  }
  if (owner) {
    if (index === 0) {
      if (state) owner.change('firstChild', node);
      else owner.set('firstChild', undefined, owner.firstChild);
    }
    var last = this.length - +state;
    if (index === last && !moving) {
      if (state || last) owner.change('lastChild', state ? node : this[last - 1]);
      else owner.set('lastChild', undefined, owner.lastChild);
    }
  }
  if (node.nodeType === 1 && (state || !moving)) {
    if (!state) 
      prev = node.previousElementSibling
    else for (var i = index - 1; prev && (prev.nodeType != 1 || prev == node);) 
      prev = this[--i];
    if (!moving && (state || !splicing))
      if (!state) 
        next = node.nextElementSibling;
      else for (var i = index + 1; next && (next.nodeType != 1 || next == node);) 
        next = this[++i];
    else next = null;
    if (prev && (!moving || meta != null)) {
      if (state || moving) {
        prev.change('nextElementSibling', node, undefined, meta);
      } else if (prev.nextElementSibling === node)
        if (next) {
          if (!emptying && !splicing) 
            prev.change('nextElementSibling', next, undefined, meta);
        } else 
          prev.set('nextElementSibling', undefined, node, meta);
      if (state) 
        node.change('previousElementSibling', prev, undefined, meta);
      else if (node.previousElementSibling)
        node.set('previousElementSibling', undefined, node.previousElementSibling, meta)
    } 
    if (next && (!state || (meta & this.LAST))) {
      if ((state && !moving) || moving) {
        next.change('previousElementSibling', node, undefined, meta);
      } else if (next.previousElementSibling === node)
        if (prev) {
          if ((state || !emptying)) 
            next.change('previousElementSibling', prev, undefined, meta);
        } else 
          next.set('previousElementSibling', undefined, node, meta);
      if (state) {
        if (!moving) node.change('nextElementSibling', next, undefined, meta);
      } else if (node.nextElementSibling)
        node.set('nextElementSibling', undefined, node.nextElementSibling, meta)
    }
  }
  if ((!state || owner != node.parentNode) && !moving)
    node.set('parentNode', state && owner || undefined, !state && owner || undefined, meta)
  if (owner) if (state) {
    if (index == 0) 
      node.change('sourceIndex', (owner.sourceIndex || 0) + 1, undefined, meta);
    else if (prev) 
      node.change('sourceIndex', (prev.sourceLastIndex || prev.sourceIndex || 0) + 1, undefined, meta);
  } else if (!moving && (state || !(meta & this.FORWARD))) 
      node.set('sourceIndex', undefined, node.sourceIndex, meta);
};
LSD.ChildNodes.prototype._onSplice = function(value, args, state) {
  var children = value.childNodes;
  if (children && children.virtual) {
    for (var i = 0, result = [], node; node = children[i++];) {
      if (this._prefilter(node)) 
        if (args.indexOf(node) == -1) {
          result.push(node);
          var more = this._onSplice(node, args)
          if (more) result.push.apply(result, more)
        }
    }
    return result;
  }
};
LSD.ChildNodes.prototype._prefilter = function(node) {
  //if (!this.virtual) {
    for (var frag = node; frag = frag.fragment;)
      if (frag.nodeType == 7 && frag.indexOf(node) > -1 && !frag.value) break;
    if (frag) return false;
  //}
  var owner = this._owner;
  if (owner && owner.proxies && !owner.proxies._bouncer(node))
    return false;
  if (node.nodeType == 7 && owner && !this.virtual) {
    node.set('parentNode', owner, undefined, 'push')
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
LSD.ChildNodes.Virtual.prototype.onSet = function(index, value, old, meta, from) {
  if (meta & this.MOVE) return;
  var subject = (this._owner || this);
  var parent = subject.parentNode || this.fragment;
  if (!parent) return;
  if (this.nodeType == 7 && !this.value && state) return;
  var node = value || old, state = !!value
  if (parent.insertBefore) {
    if (!state)
      parent.removeChild(node);
    else if (parent.childNodes.indexOf(node) == -1)
      parent.insertBefore(node, (this[index - 1] || subject).nextSibling)
  } else {
    var children = parent.childNodes;
    if (!state)
      children.splice(children.indexOf(node), 1)
    else if (children.indexOf(node) == -1)
      children.splice(children.indexOf((this[index - 1] || subject).nextSibling), 0, node);
  }
};
LSD.Properties.ChildNodes = LSD.ChildNodes;