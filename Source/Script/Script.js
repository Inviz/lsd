/*
---
 
script: Script.js
 
description: Tokenize, translate and compile LSD.Script scope into javascript functions
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD
  - LSD.Struct
  
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

LSD.Script = function(input, scope, output) {
  var regex = this._regexp, type = typeof input;
  if (regex) {
    if (scope) this.scope = scope;
    if (output) this.output = output;
    if (this.initialize) this.initialize()
    if (typeof input == 'string') input = this.Script.parsed && this.Script.parsed[input] || this.Script.parse(input);
    if (typeof input != 'object') return input;
    if (input.push) {
      this.input = input;
      this.type = 'function'
      this.name = ',';
    } else {
      for (var property in input) this[property == 'value' ? 'input' : property] = input[property];
      this.source = input;
    }
    if (this.input && this.input.push) this.args = this.input.slice();
    if (this.type === 'block') {
      this._yieldback = this.yield.bind(this);
      this._yieldback.block = this;
      if (!this.origin && this.locals) this.findLocals(this.locals);
      if (this.locals) {
        this.variables = new LSD.Object.Stack;
        if (this.scope) this.variables.merge(this.scope.variables || this.scope, true);
        this.scope = this;
      }
    }
  } else {
    if (input.script) {
      if (output) input.set('output', output);
      if (scope) {
        input.set('scope', scope);
        if (!input.attached) input.set('attached', true);
      }
      return input;
    } else {
      var Script = (this.Script || LSD.Script)
      var result = new Script(typeof type == 'string' ? Script.parse(input) : input, scope, output);
      if (result.script) {
        if (scope || input.scope) result.set('attached', true);
      } else if (output) Script.callback(output, result);
      return result;
    }
  }
};
/*
  Variables are the core of LSD.Script. A variable attaches to a widget and 
  notifies it that there's a named variable that needs to populate its value.

  A widget may have muptiple scopes of data for variables. The only scope
  that is enabled by default is microdata and dataset, so a HTML written the 
  right way provides values for variables. Microdata and dataset objects, 
  just like other other store objects used are LSD.Object-compatible. 
  These objects provide `.watch()` interface that allows to observe changes
  in object values. Any object may be used as the scope for data to populate
  variables with values.

  Each variable has a name, which is used as the key to fetch values.
  LSD.Object provides support for nested keys as in `post.author.name` that
  sets up a chain of observers and whenever any of the parts are changed,
  the variable is set a new value.

  A value may have a placeholder - default value to be used when the value
  was not found in widget.

  A variable may have a parent object, a function that has that variable 
  as argument. Whenever variable changes, it only calls parent function
  to update, and that function cascades up updating all the parents. That 
  makes values recompute lazily.

  A variable accepts `output` as a second parameter. It may be function,
  text node, a layout branch or widget. Variable class is also a base
  class for Function and Selector classes, so they are all handle
  `output` the same way.
*/
LSD.Script.Struct = new LSD.Struct({
  input: function(value, old) {
    if (this.attached && scope != null) {
      if (value) {
        if (typeof this.scope != 'function') (this.scope.variables || this.scope).watch(this.input, this);
        else this.scope(this.input, this, true);
      }
      if (old) {
        if (typeof this.scope != 'function')
          (this.scope.variables || this.scope).unwatch(this.input, this);
        else this.scope(this.input, this, false);
      }
    }
  },
  output: function(value, old) {
    
  },
  scope: function(value, old) {
    if (this.attached) this.unset('attached', this.attached)
    if (value) this.set('attached', true);
  },
  placeholder: function(value, old) {
    if (this.placeheld) this.reset('value', value);
  },
  value: function(value, old, memo) {
    if (this.frozen) return;
    if (this.yielder && this.invoked && this.invoked !== true) {
      this.yielder(value, this.invoked[0], this.invoked[1], this.invoked[2], this.invoked[3]);
      delete this.invoked[3];
    }
    if (this.process) value = this.process(value);
    if (value && value.chain && value.callChain && !value.chained) {
      var self = this, complete = function() {
        delete value.chained;
        self.onSuccess.apply(self, arguments);
        if (value.removeEvents) value.removeEvents(events);
      }
      if (value.addEvents) {
        var events = {
          cancel: function() {
            delete value.chained;
            self.onFailure.apply(self, arguments);
            value.removeEvents(events);
          }
        }
        if (value.onFailure) {
          events.failure = events.cancel;
          events.success = complete;
        } else value.complete = complete;
        value.addEvents(events);
      } else {
        value.chain(complete)
      }
      value.chained = true;
    }
    if (value == null && this.placeholder) {
      value = this.placeholder;
      this.placeheld = true;
    } else if (this.placeheld) delete this.placeheld;
    if (this.output) this.callback(value, old);
    if (this.type == 'variable') 
      if (typeof value == 'undefined' && memo !== false && !this.input && this.attached) this.set('executed', true)
      else delete this.executed
    if ((this.type != 'block' || this.yielder) && this.attached !== false && this.parents)
      for (var i = 0, parent; parent = this.parents[i++];) {
        if (!parent.translating && parent.attached !== false) {
          delete parent.executed;
          parent.set('executed', true);
        }
      }
    if (this.wrapper && this.wrapper.wrappee)
      this.wrapper.wrappee.onSuccess(value)
  },
  attached: function(value, old) {
    if (!value && typeof this.value != 'undefined') this.unset('value', this.value);
    if (this.yielded || this.type == 'function') {
      this.reset('executed', !!value);
    } else if (this.yields) {
      for (var property in this.yields) {
        var yield = this.yields[property];
        if (yield) {
          if (value) yield.attach();
          else this.yield('unyield', null, null, property);
        }
      }
    } else if (this.scope != null && (!this.type || this.type == 'variable')) {
      if (typeof this.scope != 'function') {
        if (!this.setter) var self = this, setter = this.setter = function(value, old) {
          if (typeof value == 'undefined') return self.unset('value', old);
          else return self.reset('value', value)
        };
        (this.scope.variables || this.scope)[value ? 'watch' : 'unwatch'](this.name || this.input, this.setter);
      } else this.scope(this.input, this, this.scope, !!value);  
      if (typeof this.value == 'undefined' && !this.input) this.reset('executed', value);
    }
  },
/*
  Functions only deal with data coming from variable tokens or as raw values
  like strings, numbers and objects. So a function is executed once, 
  when all of its arguments are resolved. A function has its arguments as
  child nodes in AST, so when a variable argument is changed, it propagates
  the change up in the tree, and execute the parent function with updated 
  values.

  A value is calculated once and will be recalculated when any of its variable
  arguments is changed.
*/
  executed: function(value, old, memo) {
    var name = (value || !old) ? this.name : LSD.Script.Revertable[this.name]/* || LSD.Negation[name] */ 
    || (LSD.Script.Evaluators[this.name] && this.name) || (!LSD.Script.Operators[this.name] && 'un' + this.name) || old;
    var val, result, args = [];
    if (typeof this.evaluator == 'undefined') 
      this.evaluator = LSD.Script.Evaluators[name] || null;
    if (name) 
      var literal = LSD.Script.Literal[name];
    if (this.args) loop: for (var i = 0, j = this.args.length, arg, piped = this.prepiped, origin; i < j; i++) {
      if (typeof (arg = this.args[i]) == 'undefined') continue;
      if (i === literal) {
        if (!arg.type || arg.type != 'variable') throw "Unexpected token, argument must be a variable name";
        result = arg.name;
      } else {  
        if (arg && (arg.script || arg.type)) {
          if (this.origin) origin = this.origin.args[i];
          if (origin && !origin.local && origin.script) {
            var arg = origin;
            var index = arg.parents.indexOf(this);
            if (value) {
              if (i !== null) this.args[i] = arg;
              if (index == -1) arg.parents.push(this)
            } else {
              if (index != -1) arg.parents.splice(index, 1);
            }
          } else {
            if (!arg.script && value) arg = new (this.Script || LSD.Script)(arg, this.scope);
            if (origin) arg.origin = origin;
            if (!arg.parents) arg.parents = [];
            if (value) {
              if (i !== null) this.args[i] = arg;
              if (origin && origin.local) arg.local = true;
              this.translating = true;
              var pipable = (arg.script && piped !== arg.piped); 
              if (pipable) {
                arg.prepiped = arg.piped = piped;
                delete arg.attached;
                delete arg.executed;
              }
              var attachment = arg.parents.indexOf(this) > -1;
              if (!attachment || pipable) {
                if (!attachment) arg.parents.push(this);
                if (arg.type == 'block' ? this.yielded : !arg.attached || pipable) {
                  delete arg.value;
                  if (this.scope && !arg.scope) arg.set('scope', this.scope);
                  arg.set('attached', true);
                }
              }
              this.translating = false;
            } else {
              if (arg.parents) {
                var index = arg.parents.indexOf(this);
                if (index > -1) {
                  arg.parents.splice(index, 1);
                  if (arg.type == 'block' ? this.yielded : arg.parents.length == 0 && arg.attached) arg.unset('attached', true)
                };
              }
            }
          }
          this.args[i] = arg
          result = arg.type == 'block' ? arg._yieldback : arg.value
        } else result = arg;
        if (result && result.chain && result.callChain) {
          args = [];
          break loop;
        }
      }
      args.push(result);
      piped = result;
      if (this.evaluator) {
        var evaluated = this.evaluator.call(this, result, i == j - 1);
        switch (evaluated) {
          case true:
            break;
          case false:
            for (var k = i + 1; k < j; k++) {
              var argument = this.args[k];
              if (argument != null && argument.script && argument.attached) {
                if (typeof argument.executed != 'undefined') argument.unset('executed', argument.executed, false);
              }
            }
            args = args[args.length - 1];
            break loop;
          default:
            if (evaluated != null && evaluated == false && evaluated.failure) {
              args[args.length - 1] = piped = evaluated.failure;
              break;
            } else { 
              args[args.length - 1] = evaluated;
            }
            break loop;
        }
      } else if (arg != null && value && arg.script && typeof result == 'undefined') {
        if (this.hasOwnProperty('value')) this.unset('value', this.value)
        return;
      }
    }
    if (this.context !== false) this.context = this.getContext();
    if (args == null || LSD.Script.Operators[name] || name == ',' || !(this.piped || this.context)) {
      this.isContexted = this.isPiped = false;
    } else {
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
    }
    if (args == null || !args.push) {
      this.reset('value', args)
      return args;
    }
    if (name) {
      var method = this.lookup(name, args[0]);
      if (method === true) val = args[0][name].apply(args[0], Array.prototype.slice.call(args, 1));
      else if (method) val = method.apply(this, args);
    } else val = args[0];
    this.reset('value', val, memo);
  },
  
/*
  Selectors can be used without escaping them in strings in LSD.Script. 
  A selector targetted at widgets updates the collection as the widgets
  change and recalculates the expression in real time.

  The only tricky part is that a simple selector may be recognized as
  a variable (e.g. `div.container`) or logical expression (`ul > li`) and 
  not fetch the elements. A combinator added before ambigious expression 
  would help parser to recognize selector. Referential combinators 
  `$`, `&`, `&&`, and `$$` may be used for that. Selectors are targetted
  at widgets by default, unless `$$` or `$` combinator is used.

  You can learn more about selectors and combinators in LSD.Module.Selector

  Examples of expressions with selectors:

      // Following selectors will observe changes in DOM and update collection
      // Because they are targetted at widgets

      // Count `item` children in `menu#main` widget
      "count(menu#main > item)" 

      // Returns collection of widgets related to `grid` as `items` that are `:selected`
      "grid::items:selected" 

      // Return next widget to current widget
      "& + *" 

      // Combinators that have $ or $$ as referential combinators will not observe changes
      // and only fetch element once from Element DOM 

      // Find all `item` children in `menu` in current element
      "$ menu > item"

      // Find `section` in parents that has no `section` siblings, and a details element next to it
      "$ ! section:only-of-type() + details"

      // Following example is INCORRECT, because it is AMBIGIOUS and will not be recognized selector
      "ul > li" // variable `ul` greater than `li`

      // CORRECT way: Add a combinator to disambiguate
      "& ul > li"

*/
  selector: function(value, old) {
    
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
    var wrapper = LSD.Script('prepare(), yield() || error(), after()')
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
  wrapper: function(value, old) {
    if (old) delete old.wrapped;
    if (value) value.wrapped = this;
  }
}, LSD.NodeList);
LSD.Script.prototype = new LSD.Script.Struct;
LSD.Script.prototype.Script = LSD.Script.Script = LSD.Script;

/*
  LSD is all about compiling code into asynchronous objects that observe properties.
  But sometimes there needs to be a javascript function compiled that can be used
  on a hot code and not observe any variables with as few function calls as possible.
*/
LSD.Script.prototype.toJS = function(options) {
  var source = this.source || this.input;
  if (!source) {
    if (typeof (source = options) == 'string')
      source = LSD.Script.parse(source);
    options = arguments[1];
  } else if (source.length === 1) source = source[0];
  var get = options && options.get || this._compiled_get;
  var call = options && options.call || this._compiled_call;
  var op = options && options.op || this._compiled_op;
  var context = options && options.context || (this._compiled_context && this);
  switch (typeof source) {
    case 'string': return '"' + source + '"';
    case 'number': case 'boolean': return String(source);
  }
  for (var stack = [source], i = 0, locals; i < stack.length; i++) {
    obj = stack[i];
    switch (obj && obj.type || obj) {
      case 'variable':
        // with get option all variables are translated into function calls
        stack[i] = obj.local ? obj.name : get ? get + '("' + obj.name + '")' : 'this.' + obj.name;
        break;
      case 'selector':
        stack[i] = '"' + obj.value + '"';
        break;
      case 'function':
        // with call option function calls will be dispatched through a single funciton
        var args = obj.value, arg, k = args.length
        if (LSD.Script.Operators[obj.name] && (!call || !op)) {
          var delimeter = ' ' + obj.name + ' ';
          stack[i] = ''
        } else {
          stack[i] = call ? 'this.' + call + '("' +  obj.name + '"' + (k ? ', ' : '') : obj.name + '(';
          stack.splice(i + 1, 0, ')');
        }
        for (var j = 0; j < k; j++) {
          arg = args[j];
          stack.splice(i + 1 + j * 2, 0, typeof arg == 'string' ? '"' + arg + '"' : arg);
          if (j + 1 < k) stack.splice(i + j * 2 + 2, 0, delimeter || ', ');
        }
        break;
      case 'block':
        var args = [i, 1, 'function('];
        if ((locals = obj.locals)) 
          args.push(locals.map(function(l) { return l.name }).join(', '));
        args.push(') { ', obj.value, ' }');
        stack.splice.apply(stack, args);
        break;
      default:
        if (obj != null && obj.push) {
          for (var j = 0, arg, k = obj.length; j < k; j++) {
            arg = obj[j]
            stack.splice(i + j * 3 - +(j > 0), + (j == 0), (j + 1 == k ? 'return ' : ''), (typeof arg == 'string' ? '"' + arg + '"' : arg));
            if (j > 0) stack.splice(i + j * 3 - +(j > 0), 0, '; ');
          }
        } else {
          stack[i] = String(obj)
        }
    }
  }
  return stack.join('');
};
  
/*
  Scripts are parsed, compiled and executed, but what then? Each script may
  have its own output strategy. Scripts are often resolute it on the fly
  based on what `this.output` value they are given.
  
  Callback method is shared by all LSD.Script primitives, but may be overriden.
*/
LSD.Script.prototype.eval = function() {
  return (this.evaled || (this.evaled = eval('(' + this.toJS() + ')')));
};
LSD.Script.prototype.callback = function(value, old) {
  var object = this.output;
  if (!object) return;
  switch (object.nodeType) {
    case 1:
      if (object.lsd) object.write(value)
      else object.innerHTML = value;
      break;
    case 3:
      object.nodeValue = value;
      break;
    case 5:
      object.set('value', value);
      break;
    case 8:
      break;
    default:
      switch (typeof object) {
        case 'string':
          if (typeof value == 'undefined' && typeof old != 'undefined') this.scope.unset(object, old)
          else this.scope[typeof old != 'undefined' ? 'reset' : 'set'](object, value);
          break;
        case 'function':
          object(value);
          break;
        default:
          this._callback(object, null, value);
      }
  }
};
LSD.Script.prototype.update = function(value) {
  if (this.parents) for (var i = 0, parent; parent = this.parents[i++];) {
    if (!parent.translating) {
      delete parent.value;
      parent.set('value', value);
    }
  }
}
/*
  Methods are dispatched by the first argument in LSD. If an
  argument has a function defined by that property, it uses
  that local method then. Otherwise, it looks for all parent
  scopes to find a function defined in either `methods` sub object
  or scope object itself.
  
  Finally, it falls back to helpers defined in `LSD.Script.Helpers`
  object and Object methods as a last resort.
*/
LSD.Script.prototype.lookup = function(name, arg, scope) {
  if (arg != null && typeof arg[name] == 'function') return true;
  if (scope != null || (scope = this.scope)) 
    for (; scope; scope = scope.parentScope) {
      var method = (scope.methods && scope.methods[name]) || scope[name] || (scope.variables && scope.variables[name]);
      if (typeof method == 'function') return method;
    }
  return (this.Script || LSD.Script).Helpers[name] || Object[name];
};
LSD.Script.prototype.getContext = function() {
  for (var scope = this.scope, context; scope; scope = scope.parentScope) {
    context = (scope.nodeType && scope.nodeType != 11) ? scope : scope.widget;
    if (context) break;
  }
  this.context = context || false;
  return this.context;
};
LSD.Script.prototype.Script = LSD.Script;
LSD.Script.prototype.script = true;
LSD.Script.prototype._literal = LSD.Script.prototype._properties;
LSD.Script.prototype._compiled_call = 'dispatch';
LSD.Script.prototype._regexp = /^[-_a-zA-Z0-9.]+$/;
LSD.Script.compile = LSD.Script.prototype.compile;
LSD.Script.toJS = LSD.Script.prototype.toJS;
LSD.Script.prototype.onSuccess = function(value) {
  this.reset('value', value);
};
LSD.Script.prototype.onFailure = function(value) {
  var object = new Boolean(false);
  object.failure = value;
  this.reset('value', object);
};
LSD.Script.prototype.yield = function(keyword, args, callback, index, old, limit) {
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
      if (!block) block = this.yields[index] = this.recycled && this.recycled.pop() 
      || new LSD.Script({type: 'block', locals: this.locals, input: this.input, scope: this.scope, origin: yielded});
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
        if (callback && block.invoked != null) block.invoke(null, false);
        block.unset('attached', block.attached);
        delete block.yielder;
        delete block.yielded;
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
}
LSD.Script.prototype.invoke = function(args, state, reset) {
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
    if (state != null) {
      delete this.value;
      delete this.executed;
      delete this.attached;
      this.set('attached', true);
    } else {
      this.set('executed', true)
      var result = this.value;
      delete this.executed;
    }
  }
  if (state !== true) {
    if (args == null) args = this.invoked;
    if (args === this.invoked || state == null) this.invoked = false;
    if (state != null && this.attached != null) this.unset('attached', this.attached);
    if (this.locals && args != null)
      for (var local, i = 0; local = this.locals[i]; i++)
        this.variables.unset(local.name, args[i]);
  }
  return result;
};
LSD.Script.prototype.findLocals = function(locals) {
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
  
    var fn = LSD.Function('key', 'value', 'return key % 2 ? value + 1 : value - 1')
    fn(2, 5); // 6
    
  The first object argument will be treated as a scope for variable values.
*/
LSD.Function = function() {
  var args = Array.prototype.slice.call(arguments, 0);
  for (var i = 0, j = args.length, scope, output; i < j; i++) {
    if (typeof args[i] != 'string') {
      var object = args.splice(i--, 1)[0];
      if (scope == null) scope = object;
      else output = object;
      j--;
    }
  }
  var body = LSD.Script.parse(args.pop());
  if (!body.push) body = [body];
  return (new LSD.Script({type: 'block', value: body, locals: args.map(function(arg) {
    return {type: 'variable', name: arg}
  })}, scope, output))._yieldback;
};
