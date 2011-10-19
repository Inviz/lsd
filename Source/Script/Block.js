/*
---
 
script: Script/Block.js
 
description: Reusable callback expression 
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Script
  - LSD.Script.Function
  
provides:
  - LSD.Script.Block
  
...
*/

/*
  A block is a lightweight function that executes its body in local
  variable scope and allows local variables.
  
  In expressions blocks compile down to a function, and can be passed
  in regular javascript functions as a callback.
*/

LSD.Script.Block = function(input, source, output, locals) {
  LSD.Script.Function.apply(this, arguments);
  delete this.name;
  this.callback = this.invoke.bind(this);
  this.value = this.callback;
  this.block = true;
  this.locals = locals;
  if (locals && !this.variables) {
    LSD.Script.Scope(this, this.source);
    this.source = this; 
  }
}

LSD.Script.Block.prototype = Object.append({}, LSD.Script.Function.prototype, {
  invoke: function() {
    this.invoked = true;
    if (this.locals) {
      for (var local, i = 0; local = this.locals[i]; i++)
        this.variables.set(local.name, arguments[i]);
    }
    var result = this.execute();
    console.log(123, result, [].concat(this.args))
    if (this.locals)
      for (var local, i = 0; local = this.locals[i]; i++)
        this.variables.unset(local.name, arguments[i]);
    this.invoked = false;
    return result;
  },
  
  process: function(value) {
    return this.callback;
  },
  
  onSet: function(value) {
    if (this.output) this.update(value);
    if (!this.invoked) console.error('onSet block', value)
    if (this.parent && !this.invoked) this.parent.set();
  }
})
