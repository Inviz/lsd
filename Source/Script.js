/*
---
 
script: Script.js
 
description: Tokenize, translate and compile LSD.Script source into javascript functions
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD/LSD
  
provides:
  - LSD.Script
  
...
*/


/*
  LSD.Script is a reactive language that operates on C-like expressions. LSD.Script creates
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

LSD.Script = function(input, source, output) {
  if (arguments.length == 1 && input && typeof input == 'object') {
    var options = input;
    input = options.input;
    output = options.output;
    source = options.source;
  }
  if (input.script) {
    var result = input;
    if (output) result.output = output;
    if (source) result.source = source;
  } else var result = LSD.Script.compile(input, source, output);
  if (result.script) {
    if (options) {
      if (options.placeholder) result.placeholder = options.placeholder;
      if (options.local) result.local = true;
    }
    if (source) result.attach();
  } else {
    if (output) LSD.Script.output(output, result);
  }
  return result;
};

LSD.Script.prototype = {
  callback: function(object, value, old) {
    if (object.block) {
      object.set(value);
    } else if (object.call) {
      object(value);
    } else {
      switch (object.nodeType) {
        case 1:
          if (object.lsd) object.write(value)
          else object.innerHTML = value;
          break;
        case 2:
          var widget = object.ownerElement.lsd ? object.ownerElement : Element.retrieve(object.ownerElement, 'widget');
          if (widget) {
            if (object.name == "value")
              widget.setValue(value || '');
            else
              widget.attributes.set(object.name, value);
          } else {
            object.ownerElement.setAttribute(object.name, value || '');
            object.ownerElement[object.name] = value;
          }
          break;
        case 3:
          object.nodeValue = value;
          break;
        case 8:
        default:
          if (typeof object == 'string') {
            if (typeof value == 'undefined' && typeof old != 'undefined') this.source.unset(object, old)
            else this.source[typeof old != 'undefined' ? 'reset' : 'set'](object, value)
          }
      }
    }
  },
  
  update: function(value, old) {
    var output = this.output;
    if (!output) return;
    return this.callback(this.output, value, old); 
  },
  
  wrap: function(script) {
    script.wrapper = this;
    this.wrapped = script;
  },
  
  unwrap: function(script) {
    if (script.wrapper == this) {
      script.wrapper = this.wrapper
      delete this.wrapped;
    }
  }
};
