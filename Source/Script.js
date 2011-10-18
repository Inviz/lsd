/*
---
 
script: Script.js
 
description: Tokenize, translate and compile LSD.Script source into javascript functions
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - Sheet/Sheet.Value
  
provides:
  - LSD.Script
  - LSD.Script.parse
  - LSD.Script.compile
  
...
*/


/*
  LSD.Script is a pseudo language that operates on C-like expressions. LSD.Script creates
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

LSD.Script = function(input, source, output, placeholder) {
  if (arguments.length == 1 && input && typeof input == 'object') {
    var options = input;
    input = options.input;
    output = options.output;
    source = options.source;
    placeholder = options.placeholder;
  }
  var result = LSD.Script.compile(input, source, output, true);
  if (result.variable) {
    if (placeholder) result.placeholder = placeholder;
    if (source) result.attach();
  } else {
    if (output) LSD.Script.output(output, result);
  }
  return result;
};

Object.append(LSD.Script, {
  parse: function(value) {
    if (LSD.Script.parsed) {
      var cached = LSD.Script.parsed[name];
      if (cached) return cached;
    } else LSD.Script.parsed = {};
    var found, result = [], matched = [], scope = result, text, stack = [], operator, selector;
    var regexp = LSD.Script.rExpression;
    var names = regexp.names;
    while (found = regexp.exec(value)) matched.push(found);
    for (var i = 0, last = matched.length - 1; found = matched[i]; i++) {
      if ((text = found[names._arguments]) != null) {
        var args = LSD.Script.parse(text);
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
          var operators = LSD.Script.Operators;
          previous = stack[stack.length - 1];
          if (left) left = null;
          if (previous) {
            operator = {type: 'function', name: text, index: i, scope: scope, precedence: operators && operators[text]};
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
              if (LSD.Script.Combinators[text]) {
                selector = {type: 'selector', value: text};
                scope.push(selector);
              } else throw "Left part is missing for " + text + " operator";
            } else {
              var operator = {type: 'function', name: text, index: i, scope: scope, precedence: operators && operators[text]};
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
        if (!selector && text.match(LSD.Script.rVariable)) {
          scope.push({type: 'variable', name: text});
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
    return (LSD.Script.parsed[value] = (result.length == 1 ? result[0] : result));
  },
  
  compile: function(object, source, output, parse) {
    if (parse) {
      object = LSD.Script.parse(object);
      if (object.push) {
        var name = ','
        var value = object;
      }
    }
    switch (object.type) {
      case 'variable':
        var Klass = LSD.Script.Variable;
        var value = object.name;
        break;
      case 'function':
        var Klass = LSD.Script.Function;
        if (!name) var name = object.name;
        if (!value) var value = object.value;
        break;
      case 'selector':
        var Klass = LSD.Script.Selector;
        var value = object.value;
        break;
      default:
        if (object.push) {
          var Klass = LSD.Script.Function
          var value = object;
        } else {
          return object;
        }
    }
    return new Klass(value, source, output, name);
  },
  
  output: function(object, value) {
    if (object.block) {
      object.set(value);
    } else if (object.call) {
      object(value);
    } else {
      if (value == null) value = '';
      switch (object.nodeType) {
        case 1:
          if (object.lsd) object.write(value)
          else object.innerHTML = value;
          break;
        case 2:
          var widget = object.ownerElement.lsd ? object.ownerElement : Element.retrieve(object.ownerElement, 'widget');
          if (widget) {
            if (object.name == "value")
              widget.setValue(value);
            else
              widget.attributes.set(object.name, value);
          } else {
            object.ownerElement[object.name] = value;
          }
          break;
        case 3:
          object.nodeValue = value;
          break;
        case 8:
      }
    }
  }
});

LSD.Script.rExpression = Sheet.Value.tokenize;
LSD.Script.rVariable = /^[a-z0-9][a-z_\-0-9.\[\]]*$/ig;
LSD.Script.Combinators = Array.object('+', '>', '!+', '++', '!~', '~~', '&', '&&', '$', '$$');