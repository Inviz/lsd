/*
---
 
script: Instruction.js
 
description: A node that makes interpretator do something specific
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Script
  - LSD.Fragment

provides: 
  - LSD.Instruction
 
...
*/

/*
  Script nodes like variables and function calls, are objects that really
  dont have any relation to DOM.

   But there often is a need to express a conditional block in a template,
  and then a node that holds a reference to a script doesn't sound like such
  a bad idea.

   Good news is that there is a node type reserved for such use -
  instructions nodes, that are interpreted as comments in all modern
  browsers. Instruction subclasses the whole LSD.Script, reuses its parser 
  and base object, but on top of that it includes features of fragment that 
  itself is a transparent node collection proxy.
*/
LSD.Instruction = function() {
  return LSD.Script.apply(this === LSD ? LSD.Instruction : this, arguments);
};
LSD.Instruction.prototype.initialize = function(object, parent, meta, fragment) {
  this.childNodes = this;
  this.fragment = fragment;
}
LSD.Instruction.prototype.onValueChange = function(value, old, meta) {
  if (!value && meta != 'push' && typeof meta != 'number') 
    this.setChildren(value);
  if (this.next && this.parentNode && this.parentNode == this.next.parentNode)
    if (!value && meta !== 'disable') this.next.set('attached', true);
    else if (this.next.attached) this.next.unset('attached', true, 'disable');
    
  if (value && meta != 'push' && typeof meta != 'number') 
    this.setChildren(value);
}
LSD.Instruction.parse = LSD.Script.parse;
LSD.Instruction.Script = LSD.Instruction.prototype.Script = LSD.Instruction;
LSD.Struct.implement.call(LSD.Instruction, LSD.Script.prototype);
LSD.Struct.implement.call(LSD.Instruction, LSD.Fragment.prototype);
LSD.Instruction.prototype.nodeType = 7;
LSD.Instruction.prototype._literal = LSD.Instruction.prototype._properties;
LSD.Instruction.prototype._ignore = true;
LSD.Instruction.prototype.setChildren = function(state) {
  var parent = this.parentNode;
  if (!parent) {
    if (state) {
      for (var prev = this; prev = prev.previous;)
        if (prev.parentNode) parent = prev.parentNode;
    } else {
      parent = this[0] && this[0].parentNode;
    }
    if (!parent) return;
  };
  var children = parent.childNodes;
  var index = children.indexOf(this), shift = 0;
  if (index < 0) {
    if ((!this[0] || (index = children.indexOf(this[0])) < 0)) return
  } else index ++;
  if (state) {
    if (!this._length || this[0].parentNode == this.parentNode) return;
    var args = this.slice()
    args.unshift(index, 0)
    children.splice.apply(children, args);
  } else {
    for (var j = this._length, k; --j > -1;) {
      var node = this[j];
      if ((k = children.indexOf(node)) > -1) break;
    }
    if (k > -1) children.splice(index, k - index + 1);
  }
}
LSD.Instruction.prototype._properties.next = function(value, old, meta) {
  if (this.attached && !this.value && !value.attached)
    value.set('attached', true)
};
LSD.Instruction.prototype._properties.previous = function(value, old, meta) {
  if (value.attached && !value.value && !this.attached)
    this.set('attached', true)
};
LSD.Instruction.prototype._properties.parentNode = function(value, old, meta) {
  this.mix('variables', value && (this.fragment && this.fragment != value.fragment && this.fragment.variables || value.variables), 
                    meta, old && (this.fragment && this.fragment != old.fragment && this.fragment.variables || old.variables), true);
  if (value && (!this.boundary || (this.previous && this.previous.attached && !this.previous.value))) {
    this.set('scope', value, meta);
    if (!this.attached) this.set('attached', true)
  }
  if (!value && this.attached) this.unset('attached', true, meta)
};