/*
---
 
script: Script/Function.js
 
description: Takes arguments and executes a javascript function on them 
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Script
  - LSD.Script.Variable
  
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
  this.input = input;
  this.output = output;
  this.source = source;
  this.name = name;
  this.args = Array.prototype.slice.call(input, 0);
};

LSD.Script.Function.prototype = Object.append({}, LSD.Script.Variable.prototype, {
  fetch: function(state) {
    for (var i = 0, j = this.args.length, arg; i < j; i++) {
      if ((arg = this.args[i]) == null) continue;
      if (!arg.interpolation) arg = LSD.Script.compile(this.args[i], this.source);
      if (arg.interpolation && !arg.parent) arg.parent = this;
      if (arg.value == null) var stop = true;
      this.args[i] = arg;
      if (arg.interpolation) arg.fetch(state);
    }
    if (!stop) this.set();
    return this;
  },
  
  execute: function() {
    for (var i = 0, args = [], j = this.args.length, arg; i < j; i++)
      if ((arg = this.args[i]) && arg.interpolation && arg.value == null) return null;
      else args[i] = (arg && typeof arg.value != 'undefined') ? arg.value : arg;
    if (this.name) {  
      return LSD.Script.Helpers[this.name].apply(LSD.Script.Helpers, args)
    } else {
      return args[0];
    }
  },
  
  process: function() {
    return this.execute();
  }
});