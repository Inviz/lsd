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
  if (typeof input == 'undefined') return;
  if (arguments.length == 1 && input && typeof input == 'object') {
    var options = input;
    input = options.input;
    output = options.output;
    source = options.source;
  }
  var Script = this.Script || LSD.Script;
  if (input.script) {
    var result = input;
    if (output) result.output = output;
    if (source) result.source = source;
  } else var result = Script.compile(input, source, output);
  if (result.script) {
    if (options) {
      if (options.placeholder) result.placeholder = options.placeholder;
      if (options.local) result.local = true;
    }
    if (source) result.attach();
  } else {
    if (output) Script.callback(output, result);
  }
  return result;
};
LSD.Script.Script = LSD.Script;

LSD.Script.prototype = {
  compile: function(object, source, output, parse) {
    if (parse !== false && typeof object == 'string') object = this.parse(object);
    if (object.push && object.length === 1) object = object[0];
    var Script = this.Script || LSD.Script
    switch (object.type) {
      case 'variable':
        var script = new Script.Variable(object.name, source, output);
        break;
      case 'function':
        var script = new Script.Function(object.value, source, output, object.name);
        break;
      case 'block':
        var script = new Script.Block(object.value, source, output, object.locals);
        break;
      case 'selector':
        var script = new Script.Selector(object.value, source, output);
        break;
      default:
        if (object.push) {
          var script = new Script.Function(object, source, output, ',')
        } else
          var script = object;
    }
    if (object.local) script.local = true;
    return script;
  },
  
/*
  Scripts are parsed, compiled and executed, but what then? Each script may
  have its own output strategy. Scripts are often resolute it on the fly
  based on what `this.output` value they are given.
  
  Callback method is shared by all LSD.Script primitives, but may be overriden.
*/  
  update: function(value, old) {
    var output = this.output;
    if (!output) return;
    return this.callback(this.output, value, old); 
  },
  
  callback: function(object, value, old) {
    if (object.block) {
      object.setValue(value);
    } else if (object.call) {
      object(value);
    } else {
      switch (object.nodeType) {
        case 1:
          if (object.lsd) object.write(value)
          else object.innerHTML = value;
          break;
        case 3:
          object.nodeValue = value;
          break;
        case 5:
          break;
        case 8:
          break;
        default:
          if (typeof object == 'string') {
            if (typeof value == 'undefined' && typeof old != 'undefined') this.source.unset(object, old)
            else this.source[typeof old != 'undefined' ? 'reset' : 'set'](object, value)
          }
      }
    }
  },
/*
  Methods are dispatched by the first argument in LSD. If an
  argument has a function defined by that property, it uses
  that local method then. Otherwise, it looks for all parent
  scopes to find a function defined in either `methods` sub object
  or scope object itself.
  
  Finally, it falls back to helpers defined in `LSD.Script.Helpers`
  object and Object methods as a last resort.
*/
  lookup: function(name, arg, scope) {
    if (arg != null && typeof arg[name] == 'function') return true;
    if (scope != null || (scope = this.source)) 
      for (; scope; scope = scope.parentScope)
        if (typeof ((scope.methods || scope)[name]) == 'function') 
          return (scope.methods || scope)[name];
    return this.Script.Helpers[name] || Object[name];
  },
  
/*
  Another way powerful technique is wrapping. It allows a script
  being overloaded by another script, that may alter its execution
  flow by calling its own methods and processing arguments before
  wrappee script kicks in. It also allows to call scripts after
  the wrappee, possibly handing the failed call.
  
  LSD Script wrapping is pretty much the same concept that is known
  by the name Aspects in "objective reality". Although instead
  of overloading a method, it overloads a single expression.
  
    var wrappee = LSD.Script('submit()');
    var wrapper = LSD.Script('prepare(), yield() || error(), after())
    wrapper.wrap(wrappee).execute();
    
  In example above, `prepare()` method may return data that will be
  piped to `submit()` call. Then, after submit is executed
  (synchronously or not), if it returns a falsy value, `error()`
  method is called, that can handle the error by showing a pesky
  red message to user. There's some control to what happens next,
  the expression may be automatically retried, or a user may decide
  to retry or cancel the whole chain of expression. When an expression
  is cancelled, it gets unrolled, possibly removing all side effects,
  like displayed messages, pending requests, or even putting removed
  element back on its place.
*/
  wrap: function(script) {
    script.wrapper = this;
    this.wrapped = script;
    return this;
  },
  
  unwrap: function(script) {
    if (script.wrapper == this) {
      script.wrapper = this.wrapper
      delete this.wrapped;
    }
    return this;
  },
  
  Script: LSD.Script,
  script: true
};
LSD.Script.compile = LSD.Script.prototype.compile;
LSD.Script.materialize = LSD.Script.prototype.materialize;
