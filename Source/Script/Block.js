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
  this._Variable(input, source, output)
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
  
  if (!origin && locals) 
    LSD.Script.Block.findLocalVariables(this, locals)
}

LSD.Script.Block.prototype = {
  type: 'block',
  
  yield: function(keyword, args, callback, index, old, limit) {
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
        }
        if (block) {
          if (old != null) this.yields[index] = block;
        }// else if (!limit && this._limit && index <= this._last) return;
        var oo = this.recycled && this.recycled.length
        if (!block) block = this.yields[index] = this.recycled && this.recycled.pop() || new LSD.Script.Block(this.input, this.source, null, this.locals, yielded);
        if (this.recycled && oo > this.recycled.length) console.error('REUSED BLOCK', oo, this.recycled.length, [block.lsd]);
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
        //if (block.value && ( this._last < index)) this._last = index;
        
        
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
            (this.recycled || (this.recycled = [])).include(block);
          }
        }
        break;
      default:
        return this.invoke(arguments)
    }
  },
  
  attach: function(origin) {
    if (this.invoked) {
      this.fetch(true, origin);
    } else {
      if (this.yields)
        for (var property in this.yields) {
          var yield = this.yields[property];
          if (yield) yield.attach();
        }
    }
  },
  
  detach: function(origin) {
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
  
  invoke: function(args, state, reset, origin) {
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
  },
  
  process: function(value) {
    return this.yielded ? this.execute() : this.callback;
  },
  
  onValueSet: function(value) {
    if (this.output) this.update(value);
    if (this.yielder && this.invoked && this.invoked !== true) {
      this.yielder(value, this.invoked[0], this.invoked[1], this.invoked[2], this.invoked[3]);
      delete this.invoked[3];
    }
    return LSD.Script.Variable.prototype.onValueSet.call(this, value, false);
  },
  
  update: function(value) {
    if (this.parents)
      for (var i = 0, parent; parent = this.parents[i++];) {
        parent.value = value;
        if (!parent.translating) 
          LSD.Script.Variable.prototype.onValueSet.call(parent, null, false);
      }
  }
};

Object.each(LSD.Script.Function.prototype, function(value, key) {
  if (!LSD.Script.Block.prototype[key]) LSD.Script.Block.prototype[key] = value;
});

LSD.Script.Block.findLocalVariables = function(block, locals) {
  var map = {};
  for (var i = 0, j = locals.length; i < j; i++)
    map[locals[i].name] = true;
  for (var item, stack = block.input.slice(0); item = stack.pop();) {
    if (item.type == 'variable') {
      var name = item.name;
      var dot = name.indexOf('.');
      if (dot > -1) name = name.substring(0, dot);
      if (map[name])
        for (var parent = item; parent; parent = parent.parent)
          if (parent == block.input) break;
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
