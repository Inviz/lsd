/*
---
 
script: Interpolation.js
 
description: Variable piece of html that can be asynchronously replaced with content 
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - Sheet/SheetParser.Value
  
provides:
  - LSD.Interpolation
  
...
*/

!function() {
  LSD.Interpolation = function(input, output, source) {
    this.input = input;
    this.output = output;
    this.source = source;
  };
  
  LSD.Interpolation.Function = function(input, output, source, name) {
    this.input = input;
    this.output = output;
    this.source = source;
    this.name = name;
    this.args = Array.prototype.slice.call(input, 0);
  };
  
  LSD.Interpolation.Selector = function(input, output, source) {
    this.input = input;
    this.output = output;
    this.source = source;
    this.input = input.replace(R_SELECTOR_CONTEXT, function(whole, match) {
      switch (match) {
        case "$": 
          this.element = this.source.toElement();
          return '';
        case "$$":
          this.element = this.source.toElement().ownerDocument.body;
          return '';
      }
    }.bind(this));
    this.collection = [];
    if (!source || !source.lsd) throw "Selector should be applied on widgets";
  };
  
  LSD.Interpolation.prototype = {
    interpolation: true,
    
    set: function(value) {
      this.value = this.process ? this.process(value) : value;
      this.onSet(this.value);
    },
    
    onSet: function(value) {
      if (value == null && this.placeholder) value = this.placeholder;
      if (this.output) this.update(value);
      if (this.parent) this.parent.set();
    },
    
    attach: function() {
      return this.fetch(true);
    },
    
    detach: function() {
      return this.fetch(false);
    },
    
    fetch: function(state) {
      if (!this.setter) this.setter = this.set.bind(this);
      (this.source.call ? this.source : this.request).call(this, this.input, this.setter, this.source, state);
      return this;
    },
    
    request: function(input, callback, source, state) {
      return this.source[state ? 'addInterpolation' : 'removeInterpolation'](input, callback);
    },
    
    update: function(value) {
      var output = this.output;
      if (!output) return;
      if (output.branch) {
        output.set(value);
      } else if (output.call) {
        output(value !== null);
      } else {
        if (value == null) value = '';
        switch (output.nodeType) {
          case 1:
            if (output.lsd) output.write(value)
            else output.innerHTML = value;
            break;
          case 3:
            output.nodeValue = value;
            break;
          case 8:
        }
      } 
    }     
  };
  
  LSD.Interpolation.Function.prototype = Object.append({}, LSD.Interpolation.prototype, {
    fetch: function(state) {
      for (var i = 0, j = this.args.length, arg; i < j; i++) {
        if ((arg = this.args[i]) == null) continue;
        if (!arg.interpolation) {
          arg = LSD.Interpolation.compile(this.args[i], null, this.source);
          if (!arg.parent) {
            arg.parent = this;
            if (arg.value == null) var stop = true;
          }
        }
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
        return functions[this.name].apply(functions, args)
      } else {
        return args[0];
      }
    },
    
    process: function() {
      return this.execute();
    }
  });
  
  LSD.Interpolation.Selector.prototype = Object.append({}, LSD.Interpolation.prototype, {
    request: function(input, callback, state) {
      return (this.element || this.source)[state ? 'watch' : 'unwatch'](input, callback);
    },
    
    set: function(node, state) {
      if (this.filter && !this.filter(node)) return;
      if (state) {
        this.collection.push(node);
      } else {
        var index = this.collection.indexOf(node);
        if (index > -1) this.collection.splice(index, 1);
      }
      this.value = this.collection.length ? this.collection : 0;
      this.onSet(this.value);
    }
  });
  
  // Set up helpers
  var functions = LSD.Interpolation.Functions = {
    count: function(elements) {
      return elements.push ? elements.length : +!!elements
    },
    
    pluralize: function(count, singular, plural) {
      var value = (count == 1) ? singular : (plural || (singular.pluralize()));
      var index = value.indexOf('%');
      if (index > -1) {
        return value.substr(0, index) + count + value.substr(index + 1, value.length - index - 1);
      } else {
        return count + ' ' + value;
      }
    }
  };
  
  // Import all string prototype methods as helpers (first argument is translates to string)
  for (var name in String.prototype)
    if (!functions[name] && String.prototype[name].call && name.charAt(0) != '$') 
      functions[name] = (function(name) {
        return function(a, b) {
          return String(a)[name](b);
        }
      })(name);
      
  // Import all number prototype methods as helpers (first argument is translates to number)
  for (var name in Number.prototype) 
    if (!functions[name] && Number.prototype[name].call && name.charAt(0) != '$')
      functions[name] = (function(name) {
        return function(a, b) {
          return Number(a)[name](b);
        }
      })(name);
  
  var operators = {
    '*': 1,
    '/': 1,
    '+': 2,
    '-': 2,
    '>': 4,
    '<': 4,
    '^': 4,
    '&': 4,
    '|': 4,
    '>=': 4,
    '<=': 4,
    '==': 4,
    '!=': 4,
    '===': 4,
    '!==': 4,
    '&&': 5,
    '||': 5
  };
  for (var operator in operators)
    functions[operator] = new Function('left', 'right', 'return left ' + operator + ' right');
  
  var R_TRANSLATE = SheetParser.Value.tokenize;
  var R_FIND = /\\?\{([^{}]+)\}/g;
  var R_VARIABLE = /^[a-z0-9][a-z_\-0-9.\[\]]*$/ig;
  var R_SELECTOR_CONTEXT = /^\s*([$]+)\s*/
  var parsed = {};
  var combinators = Array.object('+', '>', '!+', '++', '!~', '~~', '&', '&&', '$', '$$');
  
  Object.append(LSD.Interpolation, {
    translate: function(value) {
      var cached = parsed[name];
      if (cached) return cached;
      var found, result = [], matched = [], scope = result, text, stack = [], operator, selector;
      var names = R_TRANSLATE.names;
      while (found = R_TRANSLATE.exec(value)) matched.push(found);
      for (var i = 0, last = matched.length - 1; found = matched[i]; i++) {
        if ((text = found[names._arguments])) {
          var args = LSD.Interpolation.translate(text);
          for (var j = 0, bit; bit = args[j]; j++) if (bit && bit.length == 1) args[j] = bit[0];
          if ((text = found[names['function']])) {
            scope.push({type: 'function', name: text, value: args.push ? args : [args]});
          } else {
            scope.push(args);
          }
        } else if ((text = (found[names.dstring] || found[names.sstring]))) {
          scope.push(text);
        } else if ((text = (found[names.number]))) {
          scope.push(parseFloat(text));
        } else if ((text = found[names.operator])) {
          if (!selector) {
            previous = stack[stack.length - 1];
            if (left) left = null;
            if (previous) {
              operator = {type: 'function', name: text, index: i, scope: scope, precedence: operators[text]};
              stack.push(operator);
              if (previous.precedence > operator.precedence) {
                scope = previous.scope;
                var left = scope[scope.length - 1];
                if (left.value) {
                  if (left.value[1] != null) {
                    scope = operator.value = [left.value[1]];
                    left.value[1] = operator;
                  }
                } else throw "Right part is missing for " + left.name + " operator";
              }
            } 
            if (!left) {
              var left = scope.pop();
              if (left == null) {
                if (combinators[text]) {
                  selector = {type: 'selector', value: text};
                  scope.push(selector);
                } else throw "Left part is missing for " + text + " operator";
              } else {
                var operator = {type: 'function', name: text, index: i, scope: scope, precedence: operators[text]};
                operator.value = [left];
                stack.push(operator);
                scope.push(operator);
                scope = operator.value;
              }
            }
          } else {
            selector.value += ' ' + text;
            text = null;
          }
        } else if ((text = found[names.token])) {
          if (!selector && text.match(R_VARIABLE)) {
            scope.push({type: 'token', name: text});
          } else {
            if (!selector) {
              selector = {type: 'selector', value: text};
              scope.push(selector);
            } else {
              selector.value += ' ' + text;
              text = null;
            }
          }
        }
        if (!operator && text && stack.length) {
          var pop = stack[stack.length - 1]
          if (pop && pop.scope) scope = pop.scope;
        }
        operator = null;
      };
      return (parsed[value] = (result.length == 1 ? result[0] : result));
    },
    
    compile: function(object, output, source, translate) {
      if (translate) object = LSD.Interpolation.translate(object);
      switch (object.type) {
        case 'token':
          var Klass = LSD.Interpolation;
          var value = object.name;
          break;
        case 'function':
          var Klass = LSD.Interpolation.Function;
          var name = object.name;
          var value = object.value;
          break;
        case 'selector':
          var Klass = LSD.Interpolation.Selector;
          var value = object.value;
          break;
        default:
          if (object.push) {
            var Klass = LSD.Interpolation.Function
            var value = object;
          } else {
            return object;
          }
      }
      return new Klass(value, output, source, name);
    },
    
    textnode: function(textnode, widget, callback) {
      var node = textnode, content = node.textContent, finder, length = content.length;
      for (var match, index, last, next, compiled; match = R_FIND.exec(content);) {
        last = index || 0
        var index = match.index + match[0].length;
        expression = node;
        var cut = index - last;
        if (cut < node.textContent.length) node = node.splitText(index - last);
        if ((cut = (match.index - last))) expression = expression.splitText(cut);
        if (!callback || callback === true) callback = widget;
        compiled = LSD.Interpolation.compile(match[1], expression, callback, true);
        compiled.placeholder = match[0];
        compiled.attach();
        Element.store(expression, 'interpolation', compiled);
        last = index;
      }
    }
  })
  
}();