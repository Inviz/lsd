/*
---
 
script: Script.js
 
description: Tokenize, translate and compile LSD.Script source into javascript functions
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  
provides:
  - LSD.Script
  
...
*/


/*
  LSD.Script is a pseudo language that operates on C-like expressions. LSD.Script creates
  Abstract Syntax Tree from expression that is kept throughout the expression lifetime. 
  Every variable used in expression observes changes to its value, propagates the change
  up in a tree and recalculates the value of expression firing callbacks. So it creates 
  persistent functional expressions that automagically recalculate themselves and can 
  be detached from observing the values. 
  
  Selectors are a first class citizens in LSD.Script and do not require additional syntax. 
  An unescaped selector will fetch results in DOM upon execution. Selector that target 
  widgets also seemlessly update and recalculate expressions.
  
  LSD.Script tokenizes its input using a Sheet.js Value parsing regexps with named group
  emulation invented by SubtleGradient with impression of XRegExp.
  
  Then, AST is made from an array of tokens. The tree itself only has two types of nodes:
  a function call (which child nodes are arguments) and a leaf (value as number, string 
  or selector). Binary operators are implemented as functions and first go through a 
  specificity reordering (making multiplication execute before deduction).
  
  The last phase compiles the Abstract Syntax Tree into an object that can be passed 
  around and used to retrieve current expression value.
*/

LSD.Script = function(input, source, output, placeholder) {
  if (arguments.length == 1 && input && typeof input == 'object') {
    var options = input;
    input = options.input;
    output = options.output;
    source = options.source;
    placeholder = options.placeholder;
  }
  var result = LSD.Script.compile(input, source, output, true);
  if (result.variable) {
    if (placeholder) result.placeholder = placeholder;
    if (source) result.attach();
  } else {
    if (output) LSD.Script.output(output, result);
  }
  return result;
};

LSD.Script.output = function(object, value) {
  if (object.block) {
    object.set(value);
  } else if (object.call) {
    object(value);
  } else {
    if (value == null) value = '';
    switch (object.nodeType) {
      case 1:
        if (object.lsd) object.write(value)
        else object.innerHTML = value;
        break;
      case 2:
        var widget = object.ownerElement.lsd ? object.ownerElement : Element.retrieve(object.ownerElement, 'widget');
        if (widget) {
          if (object.name == "value")
            widget.setValue(value);
          else
            widget.attributes.set(object.name, value);
        } else {
          object.ownerElement[object.name] = value;
        }
        break;
      case 3:
        object.nodeValue = value;
        break;
      case 8:
    }
  }
};