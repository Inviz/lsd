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
  this.callback = this.yield.bind(this);
  this.callback.block = this;
  this.value = this.callback;
  this.block = true;
  this.locals = locals;
  if (locals && !this.variables) {
    LSD.Script.Scope(this, this.source);
    this.source = this; 
  }
}

LSD.Script.Block.prototype = Object.append({}, LSD.Script.Function.prototype, {
  yield: function(keyword, args, callback, index, old) {
    switch (keyword) {
      case 'yield':
        if (!this.yields) this.yields = {};
        var block = this.yields[old == null ? index : old];
        if (old != null) this.yields[index] = block;
        if (!block) block = this.yields[index] = new LSD.Script.Block(this.input, this.source, null, this.locals);
        var invoked = block.invoked;
        block.yielder = callback;
        block.invoke(args, true, !!invoked);
        if (invoked)
          for (var local, i = 0; local = block.locals[i]; i++)
            block.variables.unset(local.name, invoked[i]);
        callback.block = block;
        return block;
      case 'unyield':
        callback.call(this, null, args[0], args[1], args[2]);
        var block = this.yields[index];
        if (block.invoked) callback.block.invoke(null, false);
        delete block.yielder;
        block.detach();
        delete callback.block;
        delete callback.parent;
        break;
      default:
        return this.invoke(arguments)
    }
  },
  invoke: function(args, state, reset) {
    if (state !== false) {
      this.invoked = args;
      this.frozen = true;
      if (this.locals)
        for (var local, i = 0; local = this.locals[i]; i++)
          this.variables.set(local.name, args[i]);
      delete this.frozen;
      if (state != null) this.fetch(true, reset);
      else var result = this.execute()
    }
    if (state !== true) {
      if (args == null) args = this.invoked;
      if (args === this.invoked || state == null) this.invoked = false;
      if (state != null) this.fetch(false);
      if (this.locals)
        for (var local, i = 0; local = this.locals[i]; i++)
          this.variables.unset(local.name, args[i]);
    }
    return result;
  },
  
  process: function(value) {
    return this.yielder ? this.execute() : this.callback;
  },
  
  onSet: function(value) {
    if (this.output) this.update(value);
    if (this.yielder && this.invoked && this.invoked !== true)
      this.yielder(value, this.invoked[0], this.invoked[1], this.invoked[2]);
    if (this.parent && !this.invoked) this.parent.set();
  }
})
