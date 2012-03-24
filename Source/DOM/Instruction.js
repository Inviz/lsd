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
  Script nodes like variables and function calls,
  are objects that really dont have any relation to DOM.
  
  But there often is a need to express a conditional block
  in a template, and then a node that holds a reference
  to a script doesn't sound like such a bad idea. 
  
  Good news is that there is a node type reserved for such
  use - instructions nodes, that are interpreted as 
  comments in all modern browsers.
  
  Instruction subclasses the whole LSD.Script, reuses 
  its parser and base object, but on top of that it 
  includes features of fragment that itself is a
  transparent node collection proxy.
*/
LSD.Instruction = function() {
  return LSD.Script.apply(this === LSD ? LSD.Instruction : this, arguments);
};
LSD.Instruction.prototype.initialize = function() {
  this.childNodes = this;
}
LSD.Instruction.prototype.onValueChange = function(value, old) {
  
}
LSD.Instruction.parse = LSD.Script.parse;
LSD.Instruction.Script = LSD.Instruction.prototype.Script = LSD.Instruction;
LSD.Struct.implement.call(LSD.Instruction, LSD.Script.prototype);
LSD.Struct.implement.call(LSD.Instruction, LSD.Fragment.prototype);
LSD.Instruction.prototype.nodeType = 7;
LSD.Instruction.prototype._literal = LSD.Instruction.prototype._properties;
LSD.Instruction.prototype._properties.next = function(script) {
  
};
LSD.Instruction.prototype._properties.previous = function(script) {
  
};