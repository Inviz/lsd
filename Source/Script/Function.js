/*
---
 
script: Script/Function.js
 
description: Takes arguments and executes a javascript function on them 
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Script
  - LSD.Script.Variable
  - LSD.Script.Helpers
  
provides:
  - LSD.Script.Function
  
...
*/

/*
  Functions only deal with data coming from variable tokens or as raw values
  like strings and numbers in expressions. So a function, when all of its
  arguments are resolved is executed once. A function has its arguments as
  child nodes in AST, so when a variable argument is changed, it propagates
  the change up in the tree, and execute the parent function with updated 
  values.
  
  A value is calculated once and will be recalculated when any of its variable
  arguments is changed.
*/

LSD.Script.Function = function(input, source, output, name) {
  LSD.Script.Variable.apply(this, arguments)
  this.name = name;
  this.args = Array.prototype.slice.call(input, 0);
};

LSD.Script.Function.prototype = Object.append({}, LSD.Script.Variable.prototype, {
  fetch: function(state) {
    this.attached = state;
    var args = this.evaluate(state);
    if (args) this.set(args, !state);
    //if (this.children)
    //  for (var i = 0, child; child = this.children[i++];)
    //    child.fetch(state);
    return this;
  },
  
  execute: function(args) {
    if (!args) args = this.evaluate(true);
    if (args === null) return null;
    if (!args.push) return args;
    if (this.name) {
      var method = LSD.Script.Scope.lookup(this.source, this.name)
      if (method) return method.apply(this, args)
    } else {
      return args[0];
    }
  },
  
  evaluate: function(state) {
    var args = [], value;
    if (typeof this.evaluator == 'undefined') 
      this.evaluator = LSD.Script.Evaluators[this.name] || null;
    for (var i = 0, j = this.args.length, arg; i < j; i++) {
      if ((arg = this.args[i]) == null) continue;
      this.args[i] = arg = this.translate(arg, state, i);
      value = arg.variable ? arg.value : arg;
      args.push(value);
      if (this.evaluator) {
        var result = this.evaluator.call(this, value, i == j - 1);
        if (result != null) return result;
        else if (result === null) return null;
      } else {
        if (arg.variable && value == null) return null;
      }
    }
    return args;
  },
  
  translate: function(arg, state, i) {
    if (!arg.variable && state) arg = LSD.Script.compile(arg, this.source);
    if (arg.variable) {
      if (i !== null) this.args[i] = arg;
      if (state) {
        if (arg.parent != this) {
          arg.parent = this;
          (this.children || (this.children = [])).push(arg);
          arg.attach();
        }
      } else {
        if (arg.parent == this) {
          var index = this.children.indexOf(arg);
          if (index > -1) this.children.splice(index, 1);
          arg.detach();
          delete arg.parent;
        }
      }
    }
    return arg;
  },
  
  process: function(argument) {
    return this.execute(); 
  }
});