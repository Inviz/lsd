/*
---
 
script: Script/Helpers/Native.js
 
description: Defines logic for operators in expressions
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Script
  
provides:
  - LSD.Script.Helpers
  
...
*/

if (!LSD.Script.Helpers) LSD.Script.Helpers = {};

/*
  Returns the number of elements in collection
  
    count($ ul > li)
*/

LSD.Script.Helpers.count = function(elements) {
  return elements.push ? elements.length : +!!elements
};

LSD.Script.Helpers.concat = function() {
  return Array.prototype.join.call(arguments, '')
};

LSD.Script.Helpers['debugger'] = function() {
  debugger
};



/*
  Pluralize is a three functions in one:
  
    pluralize("beach") // => "beaches"
    
  When given a single string argument, it returns pluralized form of that word
  
    pluralize(2, "beach", "beachiz") // => "2 beachiz"
    
  When a first argument is a number and second is a word, it returns singular form
  of that word if a number is 1, and plural if its more than 2. Optional second argument
  sets custom plural form for the word
  
    pluralize(2, "comment", "beachiz (%)") => "beachiz (2)"
    
  If a string form contains placeholder in form a percent sign, it uses that spot for
  the number, instead of prepending it.
*/
  
LSD.Script.Helpers.pluralize = function(count, singular, plural) {
  var value = (count == 1) ? singular : (plural || (singular.pluralize()));
  var index = value.indexOf('%');
  if (index > -1) {
    return value.substr(0, index) + count + value.substr(index + 1, value.length - index - 1);
  } else {
    return count + ' ' + value;
  }
};
LSD.Script.Helpers.pluralize_word = function(count, singular, plural) {
  return (count == 1) ? singular : (plural || (singular.pluralize()));
};
LSD.Script.Helpers['if'] = LSD.Script.Helpers['elsif'] = function(condition, block) {
  if (block) var result = block.call(block, condition ? 'yield' : 'unyield')
  return result == null ? condition == null ? null : condition : result; 
};
LSD.Script.Helpers['else'] = function(condition, block) {
  return true;
};
LSD.Script.Helpers['unless'] = function(condition, block) {
  if (block) var result = block.call(block, condition ? 'unyield' : 'yield')
  return result == null ? condition != null ? null : !condition : !result;
};
/*
  Yield function simply returns the value. It wouldn't do anything special by itself,
  but when one script wraps another, it makes the latter be called when yield happens
  by setting the wrapped script as one of the parents of yield() function call
*/
LSD.Script.Helpers['yield'] = function(value) {
  for (var fn = this; fn = fn.parents && fn.parents[0];) {
    if (fn.wrapped) {
      fn.wrappee = this;
      fn.wrapped.prepiped = fn.wrapped.piped = value;
      delete fn.wrapped.executed;
      delete fn.wrapped.attached;
      delete fn.wrapped.value;
      fn.wrapped.set('attached', true);
      return fn.wrapped.value;
    }
  }
  return value;
};
LSD.Script.Boundaries = {'end': true, 'else': true, 'elseif': true, 'elsif': true};
LSD.Script.Helpers['[]'] = function(object, property) {
}
LSD.Script.Helpers['un[]'] = function(object, property) {
}
/*
  Define precedence values for operators. Those are
  used later in parsing to construct a correct syntax tree.
*/
   
LSD.Script.Operators = {
  '*': 1, '/': 1, '%': 1,
  '+': 2, '-': 2,
  '>': 3, '<': 3,
  '^': 4, '&': 4, '|': 4, 
  '==': 4, '===': 4, 
  '!=': 4, '!==': 4,
  '>=': 4, '<=': 4, 
  '&&': 5, '||': 5,
  '=': 10
};

/*
  Expressions separated by comma return the last bit
*/
LSD.Script.Helpers[','] = function() {
  return arguments[arguments.length - 1];
};

/*
  Evaluators define custom logic that should be invoked
  when a single argument is evaluated. Usually, operator
  accepts two arguments, but this logic may decide to
  stop execution if an argument does not conform operator
  validation rules. This enables lazy evaluation of 
  logic expressions.
*/
LSD.Script.Evaluators = {
  ',': function(expression) {
    return (expression != null) || null;
  },
  '||': function(expression) {
    if (expression != null && expression == false && expression.failure)
      return expression;
    return !expression;
  },
  '&&': function(expression) {
    return !!expression;
  }
};

/*
  All of the operators above except assignment borrow
  javascript capabilities to apply operators on any arguments.
  The logic of those operators is not implemented in LSD.Script
  because the performance is critical
*/
!function(operators) {
  for (var operator in operators)
    LSD.Script.Helpers[operator] = new Function('left', 'right', 'return left ' + operator + ' right');
}(LSD.Script.Operators)
/*
  A custom assignment operator. The variable is defined in 
  local scope and will be undefined if expression will be unrolled
*/
LSD.Script.Helpers['='] = LSD.Script.Helpers['define'] = function(name, value) {
  var scope = this.scope;
  if (scope.nodeType || scope._calculated)
    name = 'variables.' + name;
  scope.set(name, value);
  return value;
};
LSD.Script.Helpers['undefine'] = function(name, value) {
  var scope = this.scope;
  if (scope.nodeType || scope._calculated)
    name = 'variables.' + name;
  scope.set(name, undefined, value);
  return value;
}

/*
  Specify functions and their arguments that should not be parsed 
*/
LSD.Script.Literal = {
  /*
    Assignment operator does not evaluate left argument, 
    it uses it as a name for variable instead
  */
  '=': 0,
  'define': 0,
  'undefine': 0
};

/*
  A table of methods that can undo a given method with equal arguments.
  This list is incomplete, as there are other ways to define reversible
  method. 
*/

LSD.Script.Revertable = {
  '=': 'undefine',
  'define': 'undefine',
  'undefine': 'define'
};

LSD.Script.Keywords = {
  'if': true, 
  'else': true, 
  'elsif': true, 
  'unless': true
};