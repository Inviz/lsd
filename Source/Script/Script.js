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
  var regex = this._regexp;
  if (regex && (!input || (typeof input == 'string' && regex.test(input)))) {
    if (input)  this.input  = input;
    if (scope)  this.scope  = scope;
    if (output) this.output = output;
    return;
  } else if (input.script) {
    if (output) input.output = output;
    if (scope) input.scope = scope;
    return input;
  } else {
    var Script = (this.Script || LSD.Script), result = Script.compile(input, scope, output);
    if (result.script) {
      if (scope) result.attach();
    } else if (output) Script.callback(output, result);
    return result;
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
  makes values recompule lazily.

  A variable accepts `output` as a second parameter. It may be function,
  text node, a layout branch or widget. Variable class is also a base
  class for Function and Selector classes, so they are all handle
  `output` the same way.
*/
LSD.Script.Struct = new LSD.Struct({
  input: function() {

  },
  output: function() {

  },
  scope: function() {

  },
  placeholder: function() {

  },
  value: function() {
    if (value == null && this.placeholder) {
      value = this.placeholder;
      this.placeheld = true;
    } else if (this.placeheld) delete this.placeheld;
    if (this.output && output !== false) this.update(value, old);
    if (this.attached !== false && this.parents)
      for (var i = 0, parent; parent = this.parents[i++];) {
        if (!parent.translating && parent.attached !== false) parent.setValue();
      }
    if (this.wrapper && this.wrapper.wrappee)
      this.wrapper.wrappee.onSuccess(value)
    return this;
  },
  attached: function(value, old) {
    if (!value) this.unset('value', this.value);
    if (!this.setter) this.setter = this.setValue.bind(this);
    if (this.scope != null)
      this[this.scope.call ? 'scope' : 'request'](this.input, this.setter, this.scope, !!value);
    return !!value;
  },
  wrapper: function() {

  },
  wrapped: function() {

  }
});
LSD.Script.prototype = new LSD.Script.Struct;
LSD.Script.prototype.Script = LSD.Script.Script = LSD.Script;
LSD.Script.prototype.type = 'variable';
LSD.Script.prototype.request = function(input, callback, scope, state) {
  return (this.scope.variables || this.scope)[state ? 'watch' : 'unwatch'](input, callback);
};
LSD.Script.prototype.setValue = function(value, reset) {
  if (this.frozen) return;
  var old = this.value;
  this.value = this.process ? this.process(value) : value;
  if (reset || typeof this.value == 'function' || old !== this.value || (this.invalidator && (this.invalidator())))
    this.onValueSet(this.value, null, old);
};
LSD.Script.prototype.onValueSet = function(value, output, old) {
  if (value == null && this.placeholder) value = this.placeholder;
  if (this.output && output !== false) this.update(value, old);
  if (this.attached !== false && this.parents)
    for (var i = 0, parent; parent = this.parents[i++];) {
      if (!parent.translating && parent.attached !== false) parent.setValue();
    }
  if (this.wrapper && this.wrapper.wrappee)
    this.wrapper.wrappee.onSuccess(value)
  return this;
};
LSD.Script.prototype.attach = function(origin) {
  return this.fetch(true, origin);
};
LSD.Script.prototype.detach = function(origin) {
  delete this.value;
  return this.fetch(false, origin);
};
LSD.Script.prototype.fetch = function(state, origin) {
  if (this.attached ^ state) {
    if (!state) delete this.value;
    this.attached = state;
    if (!this.setter) this.setter = this.setValue.bind(this);
    if (this.scope != null)
      this[this.scope.call ? 'scope' : 'request'](this.input, this.setter, this.scope, state);
  }
  return this;
};
LSD.Script.prototype.request = function(input, callback, scope, state) {
  return (this.scope.variables || this.scope)[state ? 'watch' : 'unwatch'](input, callback);
};
LSD.Script.prototype.compile = function(object, scope, output, parse) {
  if (parse !== false && typeof object == 'string') object = this.parse(object);
  if (object.push && object.length === 1) object = object[0];
  var Script = this.Script || LSD.Script
  switch (object.type) {
    case 'variable':
      var script = new Script(object.name, scope, output);
      break;
    case 'function':
      var script = new Script.Function(object.value, scope, output, object.name);
      break;
    case 'block':
      var script = new Script.Block(object.value, scope, output, object.locals);
      break;
    case 'selector':
      var script = new Script.Selector(object.value, scope, output);
      break;
    default:
      if (object.push) {
        var script = new Script.Function(object, scope, output, ',')
      } else
        var script = object;
  }
  if (script.script) {
    script.source = object;
    if (object.local) script.local = true;
  }
  return script;
};

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
LSD.Script.prototype.update = function(value, old) {
  var output = this.output;
  if (!output) return;
  return this.callback(this.output, value, old); 
};
LSD.Script.prototype.build = function() {
  return (this.built || (this.built = eval('(' + this.toJS() + ')')));
};
LSD.Script.prototype.callback =function(object, value, old) {
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
          if (typeof value == 'undefined' && typeof old != 'undefined') this.scope.unset(object, old)
          else this.scope[typeof old != 'undefined' ? 'reset' : 'set'](object, value)
        }
    }
  }
};
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
    for (; scope; scope = scope.parentScope)
      if (typeof ((scope.methods || scope)[name]) == 'function') 
        return (scope.methods || scope)[name];
  return this.Script.Helpers[name] || Object[name];
};
  
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
LSD.Script.prototype.wrap = function(script) {
  script.wrapper = this;
  this.wrapped = script;
  return this;
};
LSD.Script.prototype.unwrap = function(script) {
  if (script.wrapper == this) {
    script.wrapper = this.wrapper
    delete this.wrapped;
  }
  return this;
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
LSD.Script.prototype._compiled_call = 'dispatch';
LSD.Script.prototype._regexp = /^[-_a-zA-Z0-9.]+$/;
LSD.Script.compile = LSD.Script.prototype.compile;
LSD.Script.toJS = LSD.Script.prototype.toJS;
