/*
---
 
script: Instruction.js
 
description: A node that makes interpretator do something specific
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Struct.Stack

provides: 
  - LSD.Instruction
 
...
*/

LSD.Instruction = LSD.Script;

LSD.Fragment = function() {
  this.childNodes = new LSD.Properties.Children.Virtual;
};
LSD.Instruction.prototype.nodeType = 5;