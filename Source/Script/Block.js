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

LSD.Script.Block = function(input, source, output, locals, origin) {
  this.input = input;
  this.output = output;
  this.source = source;
  this.args = Array.prototype.slice.call(input, 0);
  delete this.name;
  this.callback = this.yield.bind(this);
  this.callback.block = this;
  this.value = this.callback;
  if (locals != null) {
    this.locals = locals;
    if (!this.variables) {
      this.variables = new LSD.Object.Stack;
      if (this.source) this.variables.merge(this.source.variables || this.source);
      this.parentScope = this.source;
      this.source = this;
    }
  }
  this.origin = origin;
  
  if (!origin && locals) this.findLocals(locals);
}

LSD.Script.Block.prototype = new LSD.Script.Function;
LSD.Script.Block.prototype.type = 'block',
LSD.Script.Block.prototype.yield = function(keyword, args, callback, index, old, limit) {
  if (args == null) args = [];
  switch (keyword) {
    case 'yield':
      if (!this.yields) this.yields = {};
      if (!this.values) this.values = {};
      if (old == null || old === false) {
        var block = this.yields[index];
      } else {
        var yielded = this.yields[old];
        if (yielded) {
          var block = this.yields[index] = this.yields[old];
          this.values[old] = block.value;
          delete this.yields[old];
        }
      }
      if (!block) {
        for (var property in this.yields) {
          var yielded = this.yields[property];
          if (yielded.invoked) break;
          else yielded = null;
        }
      } else if (old != null) this.yields[index] = block;
      if (!block) block = this.yields[index] = this.recycled && this.recycled.pop() || new LSD.Script.Block(this.input, this.source, null, this.locals, yielded);
      var invoked = block.invoked;
      block.yielded = true;
      block.yielder = callback;
      if (limit) {
        args = args.slice();
        delete args[3];
        this._limit = limit;
      }
      block.invoke(args, true, !!invoked);
      if (invoked && block.locals)
        for (var local, i = 0; local = block.locals[i]; i++)
          block.variables.unset(local.name, invoked[i]);
      if (callback) callback.block = block;
      if (this._limit && !block.value) {
        var recycled = this.recycled;
        if (!recycled) recycled = this.recycled = [];
        var i = recycled.indexOf(block);
        if (i == -1) recycled.push(block);
        delete this.yields[index];
      }
      return block;
    case 'unyield':
      var block = this.yields && this.yields[index];
      if (callback) callback.call(this, block ? block.value : this.values ? this.values[index] : null, args[0], args[1], args[2], args[3]);
      if (block) {
        if (callback && block.invoked) block.invoke(null, false);
        delete block.yielder;
        delete block.yielded;
        block.detach();
        if (callback) {
          delete callback.block;
          delete callback.parent;
        };
        if (this._limit) {
          delete this.yields[index];
          (this.recycled || (this.recycled = [])).include(block);
        }
      }
      return block;
      break;
    default:
      return this.invoke(arguments)
  }
};
LSD.Script.Block.prototype.attach = function(origin) {
  if (this.invoked) {
    this.fetch(true, origin);
  } else {
    if (this.yields)
      for (var property in this.yields) {
        var yield = this.yields[property];
        if (yield) yield.attach();
      }
  }
};
LSD.Script.Block.prototype.detach = function(origin) {
  if (this.invoked) {
    this.fetch(false, origin);
  } else {
    delete this.value;
    if (this.yields)
      for (var property in this.yields) {
        var yield = this.yields[property];
        if (yield) this.yield('unyield', null, null, property);
      }
  }
},
LSD.Script.Block.prototype.invoke = function(args, state, reset, origin) {
  if (state !== false) {
    this.invoked = args;
    this.frozen = true;
    if (args != null) {
      this.prepiped = args[0];
      if (this.locals)
        for (var local, i = 0; local = this.locals[i]; i++)
          this.variables.set(local.name, args[i]);
    }
    delete this.frozen;
    if (state != null) this.fetch(true, origin, reset);
    else var result = this.execute()
  }
  if (state !== true) {
    if (args == null) args = this.invoked;
    if (args === this.invoked || state == null) this.invoked = false;
    if (state != null) this.fetch(false);
    if (this.locals && args != null)
      for (var local, i = 0; local = this.locals[i]; i++)
        this.variables.unset(local.name, args[i]);
  }
  return result;
};
LSD.Script.Block.prototype.process = function(value) {
  return this.yielded ? this.execute() : this.callback;
};
LSD.Script.Block.prototype.onValueSet = function(value) {
  if (this.output) this.update(value);
  if (this.yielder && this.invoked && this.invoked !== true) {
    this.yielder(value, this.invoked[0], this.invoked[1], this.invoked[2], this.invoked[3]);
    delete this.invoked[3];
  }
  return LSD.Script.Variable.prototype.onValueSet.call(this, value, false);
};
LSD.Script.Block.prototype.update = function(value) {
  if (this.parents) for (var i = 0, parent; parent = this.parents[i++];) {
    parent.value = value;
    if (!parent.translating) 
      LSD.Script.Variable.prototype.onValueSet.call(parent, null, false);
  }
};
LSD.Script.Block.prototype.findLocals = function(locals) {
  var map = {};
  for (var i = 0, j = locals.length; i < j; i++)
    map[locals[i].name] = true;
  for (var item, stack = this.input.slice(0); item = stack.pop();) {
    if (item.type == 'variable') {
      var name = item.name;
      var dot = name.indexOf('.');
      if (dot > -1) name = name.substring(0, dot);
      if (map[name])
        for (var parent = item; parent; parent = parent.parent)
          if (parent == this.input) break;
          else parent.local = true;
    } else {
      if (item.name == '=' || item.name == 'define') 
        map[item.value[0].name] = true;
      if (item.value)
        for (var k = 0, l = item.value.length, value; k < l; k++) {
          var value = item.value[k];
          if (value == null || !value.hasOwnProperty('type')) continue;
          value.parent = item;
          stack.push(value);
        }
    }
  }
};
/*
  LSD.Function constructor and function is a Function compatible
  API to produce a javascript function that calls LSD.Script
  
    var fn = LSD.Function('key', 'value', 'return key % 2 ? value + 1 : value - 1)
    fn(2, 5); // 6
    
  The first object argument will be treated as a source for variable values.
*/
LSD.Function = function() {
  var args = Array.prototype.slice.call(arguments, 0);
  for (var i = 0, j = args.length, source, output; i < j; i++) {
    if (typeof args[i] != 'string') {
      var object = args.splice(i--, 1)[0];
      if (source == null) source = object;
      else output = object;
      j--;
    }
  }
  var body = LSD.Script.parse(args.pop());
  if (!body.push) body = [body];
  return new LSD.Script.Block(body, source, output, args.map(function(arg) {
    return {type: 'variable', name: arg}
  })).value;
};