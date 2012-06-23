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
LSD.Instruction.prototype.initialize = function() {
  this.childNodes = this;
}
LSD.Instruction.prototype.onValueChange = function(value, old, meta) {
  if (!value && meta != 'push' && typeof meta != 'number') 
    this.setChildren(value);
  if (this.next && this.parentNode && this.parentNode == this.next.parentNode)
    if (!value && meta !== 'disable') this.next.set('attached', true);
    else if (this.next.attached) this.next.unset('attached', true, 'disable');
  if (value && meta != 'push' && typeof meta != 'number') 
    this.setChildren(value);
  if (!value) {
    var fragments = this.childFragments;
    if (fragments) for (var i = 0, fragment; fragment = fragments[i++];)
      if (fragment.attached) fragment.unset('attached', fragment.attached);
  }
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
    for (var prev = this; prev = prev.previous;)
      if (prev.parentNode) parent = prev.parentNode;
    if (!parent) return;
  };
  var children = parent.childNodes;
  var index = children.indexOf(this);
  if (index < 0) return; 
  if (state) {
    if (!this._length || this[0].parentNode == this.parentNode) return;
    var args = this.slice()
    args.unshift(index + 1, 0)
    children.splice.apply(children, args);
  } else {
    for (var i = 0, j = 0, child; child = this[i++];)
      if (children.indexOf(child) > -1)
        j++;
    if (j) children.splice(index + 1, j);
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
  this.mix('variables', value && value.variables, meta, old && old.variables, true);
  if (value && (!this.boundary || (this.previous && this.previous.attached && !this.previous.value))) {
    this.set('scope', value, meta);
    if (!this.attached) this.set('attached', true)
  }
};
LSD.Instruction.prototype._properties.parentCollection = function(value, old, meta) {
  this.mix('variables', value && value.variables, meta, old && old.variables, true);
  if (!value.childFragments) value.childFragments = [];
  if (old) {
    var index = value.childFragments.indexOf(this);
    if (index > -1) value.childFragments.splice(index, 1);
  }
  if (value) value.childFragments.push(this)
};