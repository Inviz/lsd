/*
---
 
script: Script/Parser.js
 
description: Tokenize, translate and compile LSD.Script into javascript functions
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Script
  - Sheet/combineRegExp
  
provides:
  - LSD.Script.Parser
  - LSD.Script.parse
  - LSD.Script.compile
  
...
*/

LSD.Script.Parser = function() {};
LSD.Script.Parser.prototype.parse = LSD.Script.parse = function(value) {
  if (LSD.Script.parsed) {
    var cached = LSD.Script.parsed[name];
    if (cached) return cached;
  } else LSD.Script.parsed = {};
  var found, result = [], matched = [], scope = result, text, stack = [], operator, selector, block, token, fn;
  var regexp = LSD.Script.Parser.tokenize;
  var names = regexp.names;
  while (found = regexp.exec(value)) matched.push(found);
  for (var i = 0, last = matched.length - 1; found = matched[i]; i++) {
    if ((text = found[names.fn_arguments]) != null) {
      var args = LSD.Script.parse(text);
      if (args.push)
        for (var j = 0, bit; bit = args[j]; j++) if (bit && bit.length == 1) args[j] = bit[0];
      if (found[names.fn_tail]) {
        if (args.push) args.unshift(scope.pop());
        else args = [scope.pop(), args];
      }
      if ((text = found[names.fn])) {
        if (!args.push) args = [args];
        fn = {type: 'function', name: text, value: args};
      } else {
        fn = args;
      }
      scope.push(fn);
    } else if ((text = found[names.block])) {
      /* 
        if a block is met after the token, make token a function call
        function calls dont need to have parenthesis when given a block
      */
      if (token && !args) {
        scope.pop();
        args = []
        var bits = token.name.split('.');
        var method = bits.pop();
        if (token.tail) var parenttoken = scope.pop();
        if (bits.length) {
          if (parenttoken) parenttoke.name += bits.join('.');
          else parenttoken = {type: 'variable', name: bits.join('.')}
        }
        if (parenttoken) args.unshift(parenttoken);
        scope.push({type: 'function', name: method, value: args})
      } 
      var body = LSD.Script.parse(text);
      if (body.push)
        for (var j = 0, bit; bit = body[j]; j++) if (bit && bit.length == 1) body[j] = bit[0];
      var block = {type: 'block', value: body.push ? body : [body]}
      if ((text = found[names.block_arguments])) {
        block.locals = LSD.Script.parse(text);
        if (!block.locals.push) block.locals = [block.locals];
      }
      (args || scope).push(block);
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
          /*
            If an operator is met at the beginning of the expression,
            treat it like selector
          */
          if (left == null) {
            if (LSD.Script.Parser.Combinators[text]) {
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
      var tail = found[names.token_tail];
      if (!selector && text.match(LSD.Script.Parser.rVariable)) {
        /*
          If a token starts with the dot, it should be added
          to previous token.
        */
        if (!tail || !token) {
          token = {type: 'variable', name: text};
          if (tail) token.tail = true;
          scope.push(token);
        } else {
          token.name += '.' + text;
        }
      } else {
        /*
          Compose a selector from various tokens
        */
        if (tail) text = '.' + text;
        if (!selector) {
          selector = {type: 'selector', value: text};
          scope.push(selector);
        } else {
          selector.value += ' ' + text;
          text = null;
        }
      }
    }
    if (args) {
      if (fn) fn = null;
      else args = null;
    }
    if (token && scope[scope.length - 1] != token) token = null;
    if (!operator && text && stack.length) {
      var pop = stack[stack.length - 1]
      if (pop && pop.scope) scope = pop.scope;
    }
    operator = null;
  };
  return (LSD.Script.parsed[value] = (result.length == 1 ? result[0] : result));
};

LSD.Script.Parser.prototype.compile = LSD.Script.compile = function(object, source, output, parse) {
  if (parse) object = LSD.Script.parse(object)
  switch (object.type) {
    case 'variable':
      return new LSD.Script.Variable(object.name, source, output);
    case 'function':
      return new LSD.Script.Function(object.value, source, output, object.name);
    case 'block':
      return new LSD.Script.Block(object.value, source, output, object.locals);
    case 'selector':
      return new LSD.Script.Selector(object.value, source, output);
    default:
      if (object.push)
        return new LSD.Script.Function(object, source, output, ',')
      else
        return object;
  }
};

LSD.Script.Parser.rVariable = /^[a-z0-9][a-z_\-0-9.\[\]]*$/ig;
LSD.Script.Parser.Combinators = Array.object('+', '>', '!+', '++', '!~', '~~', '&', '&&', '$', '$$');

!function(Parser) {
  var x = combineRegExp
  var OR = '|'
  var rRound = "(?:[^()]|\\((?:[^()]|\\((?:[^()]|\\((?:[^()]|\\([^()]*\\))*\\))*\\))*\\))";
  var rCurly = "(?:[^{}]|\\{(?:[^{}]|\\{(?:[^{}]|\\{(?:[^{}]|\\{[^{}]*\\})*\\})*\\})*\\})";

  ;(Parser.fn = x("(?:(\\.)\\s*)?([-_a-zA-Z0-9]*)\\s*\\((" + rRound + "*)\\)"))
  .names = [     'fn_tail',    'fn',                  'fn_arguments']

  ;(Parser.block = x("\\s*\\{\\s*(?:\\|\\s*([^|]*)\\|\\s*)?\\s*((?:"+rCurly+")*)\\s*\\}"))
  .names = [                'block_arguments',                'block']
  
  ;(Parser.integer = x(/[-+]?\d+/))
  ;(Parser['float'] = x(/[-+]?(?:\d+\.\d*|\d*\.\d+)/))
  ;(Parser._length = x(['(', Parser['float'],  OR, Parser['integer'], ')', '(em|px|pt|%|fr|deg|(?=$|[^a-zA-Z0-9.]))']))
  .names = [           'number',                                        'unit'];

  ;(Parser.comma = x(/\s*,\s*/, 'comma'))
  ;(Parser.whitespace = x(/\s+/, 'whitespace'))
  ;(Parser.operator = x(/[-+]|[\/%^~=><*\^!|&$]+/, 'operator'))

  ;(Parser.stringDouble = x(/"((?:[^"]|\\")*)"/)).names = ['dstring']
  ;(Parser.stringSingle = x(/'((?:[^']|\\')*)'/)).names = ['sstring']
  ;(Parser.string = x([Parser.stringSingle, OR, Parser.stringDouble]))
  ;(Parser.token = x(/(?:(\.)\s*)?([^$,\s\/().]+)/)).names = ['token_tail', 'token']

  Parser.tokenize = x
  (
    [ x(Parser.fn),
    , OR
    , x(Parser.block),
    , OR
    , x(Parser.comma)
    , OR
    , x(Parser.whitespace)
    , OR
    , x(Parser.string)
    , OR
    , x(Parser._length)
    , OR
    , x(Parser.operator)
    , OR
    , x(Parser.token)
    ]
  )
}(LSD.Script.Parser);