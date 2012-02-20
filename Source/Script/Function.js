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

LSD.Script.Function = function(input, scope, output, name) {
  if (!input) return;
  this.input = input;
  this.output = output;
  this.scope = scope;
  this.name = name;
  this.args = Array.prototype.slice.call(input, 0);
};

LSD.Script.Function.prototype = new LSD.Script.Variable;
LSD.Script.Function.prototype.type = 'function',
LSD.Script.Function.prototype.fetch = function(state, origin, reset) {
  if (origin) this.origin = origin;
  this.attached = state;
  var args = this.evaluate(state);
  if (state) {
    if (args) this.setValue(args, !state || reset);
  } else {
    if (this.name) this.unexecute()
  }
  return this;
};
LSD.Script.Function.prototype.execute = function(args, name) {
  args = this.evaluate(true);
  if (typeof args == 'undefined') return;
  if (!args.push) return args;
  if (name == null) name = this.name;
  if (name) {
    var method = this.lookup(name, args[0])
    if (method === true) 
      return args[0][name].apply(args[0], Array.prototype.slice.call(args, 1)) 
    else if (method)
      return method.apply(this, args)
  } else {
    return args[0];
  }
};
LSD.Script.Function.prototype.unexecute = function() {
  var name = this.name;
  if (!name) return;
  var revert = LSD.Script.Revertable[name]// || LSD.Negation[name];
  if (!revert && LSD.Script.Evaluators[name]) revert = name;
  if (!revert && !LSD.Script.Operators[name]) revert = 'un' + name;
  if (!revert) return
  var args = this.executed;
  delete this.executed;
  return this.execute(args, revert);
};
LSD.Script.Function.prototype.evaluate = function(state) {
  var args = [], value;
  if (typeof this.evaluator == 'undefined') 
    this.evaluator = LSD.Script.Evaluators[this.name] || null;
  if (this.name) 
    var literal = LSD.Script.Literal[this.name];
  for (var i = 0, j = this.args.length, arg, piped = this.prepiped; i < j; i++) {
    if (typeof (arg = this.args[i]) == 'undefined') continue;
    if (i === literal) {
      if (!arg.type || arg.type != 'variable') throw "Unexpected token, argument must be a variable name";
      value = arg.name;
    } else {
      if (arg && (arg.script || arg.type)) {
        arg = this.args[i] = this.translate(arg, state, i, piped, this.origin ? this.origin.args[i] : null);
        value = arg.value
      } else {
        value = arg;
      }
      if (value && value.chain && value.callChain) return [];
    }
    args.push(value);
    piped = value;
    if (this.evaluator) {
      var evaluated = this.evaluator.call(this, value, i == j - 1);
      switch (evaluated) {
        case true:
          break;
        case false:
          for (var k = i + 1; k < j; k++) {
            var argument = this.args[k];
            if (argument != null && argument.script && argument.attached && argument.type == 'function')
              argument.unexecute()
          }
          return args[args.length - 1];
        default:
          if (evaluated != null && evaluated == false && evaluated.failure) {
            args[args.length - 1] = piped = evaluated.failure;
            break;
          } else { 
            args[args.length - 1] = evaluated
            return args;
          }
      }
    } else {
      if (arg != null && arg.script && typeof value == 'undefined' && !LSD.Script.Keywords[this.name]) return;
    }
  }
  if (this.context !== false) this.context = this.getContext();
  if (args == null || LSD.Script.Operators[this.name] || this.name == ',' 
  || !(this.piped || this.context)) {
    this.isContexted = this.isPiped = false;
    return args;
  } else return this.augment(args, this.name);
};
LSD.Script.Function.prototype.augment = function(args, name) {
  if (this.context) {
    this.isContexted = true;
    if (this.context.nodeType && this.context[name] && (args[0] == null || !args[0].nodeType))
      args.unshift(this.context);
  }
  if (this.piped) {
    this.isPiped = true;
    if (this.piped.nodeType && this.piped[name] && (args[0] == null || (!args[0].nodeType && !args[0][name]))) {
      args.unshift(this.piped)
    } else {
      args.push(this.piped)
    }
  }
  return args;
};
LSD.Script.Function.prototype.translate = function(arg, state, i, piped, origin) {
  if (!arg.script && state) arg = LSD.Script.compile(arg, this.scope, null, false);
  if (!arg.parents) arg.parents = [];
  if (origin && !origin.local && origin.script) {
    var arg = origin;
    var index = arg.parents.indexOf(this);
    if (state) {
      if (i !== null) this.args[i] = arg;
      if (index == -1) arg.parents.push(this)
    } else {
      if (index != -1) arg.parents.splice(index, 1);
    }
  } else {
    if (state) {
      if (i !== null) this.args[i] = arg;
      if (origin && origin.local) arg.local = true;
      this.translating = true;
      var pipable = (arg.script && piped !== arg.piped); 
      if (pipable) arg.prepiped = arg.piped = piped;
      var attachment = arg.parents.indexOf(this) > -1;
      if (!attachment || pipable) {
        if (!attachment) arg.parents.push(this);
        if (!arg.attached || pipable) arg.attach(origin);
      }
      this.translating = false;
    } else {
      if (arg.parents) {
        var index = arg.parents.indexOf(this);
        if (index > -1) {
          arg.parents.splice(index, 1);
          if (arg.parents.length == 0 && arg.attached) arg.detach(origin)
        };
      }
    }
  }
  return arg;
};
LSD.Script.Function.prototype.onSuccess = function(value) {
  this.value = value;
  this.onValueSet(this.value);
};
LSD.Script.Function.prototype.onFailure = function(value) {
  this.value = new Boolean(false);
  this.value.failure = value;
  this.onValueSet(this.value);
};
LSD.Script.Function.prototype.process = function(args) {
  this.executed = args;
  var value = this.execute(args);
  if (value && value.chain && value.callChain && !value.chained) {
    var self = this, complete = function() {
      delete value.chained;
      self.onSuccess.apply(self, arguments);
      if (value.removeEvents) value.removeEvents(events);
    }
    if (value.addEvents) {
      var events = {
        complete: complete,
        cancel: function() {
          delete value.chained;
          self.onFailure.apply(self, arguments);
          value.removeEvents(events);
        }
      }
      // If it may fail, we should not simply wait for completion
      if (value.onFailure) {
        events.failure = events.cancel;
        events.success = events.complete;
        delete events.complete;
      }
      value.addEvents(events);
    } else {
      value.chain(complete)
    }
    value.chained = true;
  }
  return value;
};