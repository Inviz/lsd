/*
---
 
script: Instruction.js
 
description: A node that makes interpretator do something specific
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Script
  - LSD.Element

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
*/

LSD.Instruction = function(input) {
  var script = new LSD.Script(input)
  script.nodeType = 5;
  script.childNodes = new LSD.Properties.ChildNodes.Virtual;
  return script;
};
LSD.Script.prototype._properties.alternative = function(script) {
  
};
['appendChild', 'insertBefore', 'removeChild', 'inject', 'grab'].each(function(method) {
  LSD.Script.prototype[method] = LSD.Element.prototype[method];
});