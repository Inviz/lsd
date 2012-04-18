/*
---
 
script: Script.js
 
description: Tokenize, translate and compile LSD.Script scope into javascript functions
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - Sheet/combineRegExp
  - LSD.Script
  
provides:
  - LSD.Script.Parser
  - LSD.Script.parse
...
*/

/*
  LSD.Script.Parser is a regex-aided one-pass parser.
  
  Features:
    * Ruby-like blocks {|a| a + 1} syntax
    * Optional [] getter syntax with expressions
    * Local variables finder
    * Units and selectors are parsed correctly
    * Operators precedence fixed at parse time
    * Optional parenthesis-free method call
    - No array or hash literal syntax yet
*/


!function(exports) {
var Parser = LSD.Script.Parser = function() {};
Parser.prototype.parse = LSD.Script.prototype.parse = LSD.Script.parse = function(value, meta, bypass) {
  if (value.indexOf('\n') > -1) return LSD.Script.Parser.multiline(value);
  if (LSD.Script.parsed) {
    var cached = LSD.Script.parsed[value];
    if (cached && !bypass) return cached;
  } else LSD.Script.parsed = {};
  var found, result = [], matched = [], scope = result, text, stack = [], operator, selector, block, token, fn;
  var regexp = LSD.Script.Parser.tokenize;
  var names = regexp.names;
  while (found = regexp.exec(value)) matched.push(found);
  for (var i = 0, last = matched.length - 1; found = matched[i]; i++) {
    if ((text = found[names.token])) {
      var tail = found[names.token_tail], replacement;
      if (!selector && text.match(Parser.rVariable)) {
        /*
          If a token starts with the dot, it should be added
          to previous token.
        */
        replacement = Parser.Tokens[text];
        if (typeof replacement != 'undefined' || text == 'undefined') {
          scope.push(replacement);
        } else if (!tail || !token) {
          // something variable
          if (token) {
            var functioned = token;
            token.type = 'function';
            token.value = scope = [];
          // something[key] variable
          } else if (getter && whitespaced) {
            var bits = getter.value[1].split('.');
            var method = bits.pop();
            if (bits.length) {
              getter.value[1] = bits.join('.');
              fn = {type: 'function', name: method, value: [getterscope.pop()]}
            } else {
              fn = {type: 'function', name: method, value: [getterscope.pop().value[0]]}
            }  
            getterscope.push(fn);
            scope = fn.value;
          }
          if (!token && tail) {
            if (!getter) {
              var getter = {type: 'function', name: '[]', value: [scope.pop(), text]}, getterscope = scope;
              scope.push(getter);
              scope = getter.value;
            } else {
              getter.value[1] += '.' + text;
            }
          } else {
            token = {type: 'variable', name: text};
            if (meta && meta.locals && meta.locals[text]) token.local = true;
            if (tail) token.tail = true;
            scope.push(token);
          }
        } else token.name += '.' + text;
      } else {
        /*
          Compose a selector from various tokens
        */
        if (tail) text = '.' + text;
        if (!selector) {
          selector = {type: 'selector', value: text};
          scope.push(selector);
        } else {
          selector.value += ((!whitespaced && tail) ? '' : ' ') + text;
          text = null;
        }
      }
      whitespaced = null;
    } else if ((text = found[names.fn_arguments]) != null) {
      var args = LSD.Script.parse(text, meta, true);
      if (args.push)
        for (var j = 0, bit; bit = args[j]; j++) if (bit && bit.length == 1) args[j] = bit[0];
      if (found[names.fn_tail]) {  
        if (getterscope) scope = getterscope;
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
    } else if ((text = found[names.index])) {
      if (selector) {
        selector.value += found[0];
        text = null;
      } else {
        var left = scope.pop();
        if (typeof left == 'undefined') throw "[] object index should come after an object"
        var body = LSD.Script.parse(text, meta, true);
        if (!body.push) body = [body];
        body.unshift(left)
        scope.push({type: 'function', name: '[]', value: body});
      }
    } else if ((text = found[names.operator])) {
      if (!selector) {
        var operators = LSD.Script.Operators;
        previous = stack[stack.length - 1];
        if (left) left = null;
        if (previous) {
          operator = {type: 'function', name: text, index: i, stack: scope, precedence: operators && operators[text]};
          stack.push(operator);
          if (previous.precedence > operator.precedence) {
            scope = previous.stack;
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
            var operator = {type: 'function', name: text, index: i, stack: scope, precedence: operators && operators[text]};
            operator.value = [left];
            stack.push(operator);
            scope.push(operator);
            scope = operator.value;
          }
        }
      } else selector.value += ' ' + text;
      token = null;
    } else {
      var whitespaced = found[names.whitespace];
      if (!whitespaced && !found[names.comma]) {
        if (!functioned && (token || getter)) {
          // something[key].method 123
          if (!token) {
            var bits = getter.value[1].split('.');
            var method = bits.pop();
            if (bits.length) {
              getter.value[1] = bits.join('.');
              args = [getterscope.pop()]
            } else {
              args = [getterscope.pop().value[0]]
            }
            scope = getterscope;
          // something.method 123
          } else {
            scope.pop();
            args = []
            var bits = token.name.split('.');
            var method = bits.pop();
            if (token.tail) var parent = scope.pop();
            if (bits.length) {
              if (parent) parent.name += bits.join('.');
              else parent = {type: 'variable', name: bits.join('.')};
              if (token.local) parent.local = token.local;
            }  
            if (parent) args.unshift(parent);
          }  
          scope.push({type: 'function', name: method, value: args})
          scope = args
          var functioned = token;
        }
        if ((text = (found[names.dstring] != null ? found[names.dstring] : found[names.sstring])) != null) {
          scope.push(text);
        } else if ((text = (found[names.number]))) {
          scope.push(parseFloat(text));
        } else if ((text = found[names.block])) {
          if ((fn = found[names.block_arguments])) {
            var locals = LSD.Script.parse(fn, null, true);
            if (!locals.push) locals = [locals];
            if (!meta) meta = {};
            if (!meta.locals) meta.locals = {}
            for (var j = 0, k = locals.length, local; j < k; j++)
              if ((local = locals[j]) && local.name) meta.locals[local.name] = (meta.locals[local.name] || 0) + 1;
          }
          var body = LSD.Script.parse(text, meta, true);
          if (body.push)
            for (var j = 0, bit; bit = body[j]; j++) if (bit && bit.length == 1) body[j] = bit[0];
          var block = {type: 'block', value: body.push ? body : [body]}
          if (locals) {
            block.locals = locals;
            for (var j = 0, k = locals.length, local; j < k; j++)
              if ((local = locals[j]) && local.name) meta.locals[local.name]--;
          }
          (args || scope).push(block);
        }
      }
    }
    if (args) {
      if (fn) fn = null;
      else args = null;
    }
    if (!whitespaced && getter && !tail) getter = null
    if (found[names.comma] || found[name.semicolon] || (token && scope[scope.length - 1] != token && !tail)) token = null;
    if (!operator && text && stack.length) {
      var pop = stack[stack.length - 1]
      if (pop && pop.stack) scope = pop.stack;
    }
    tail = block = operator = null;
  }
  return (LSD.Script.parsed[value] = (result.length == 1 ? result[0] : result));
};

Parser.multiline = function(scope) {
  for (var match, lines = [], regex = LSD.Script.Parser.rLine; match = regex.exec(scope);) 
    if (match[2] !== "") lines.push(match.splice(1));
  var args, baseline, blocks = [], indent, level = 0, meta = {};
  for (var k = 0, line, results = [], previous, i = 0; line = lines[k]; k++) {
    if (baseline) {
      if (line[0].substr(0, baseline.length) != baseline) {
        throw "Inconsistent indentation: `" + 
          line[0].replace(/\t/g, '\\t').replace(/\s/g, '\\s') + 
          "` but `" + 
          baseline.replace(/\t/g, '\\t').replace(/\s/g, '\\s') + 
          "` is a baseline"
      }
      var extras = line[0].slice(baseline.length);
      if (indent) {
        for (var i = 0, j = extras.length, step = indent.length; i * step < j; i ++) {
          if ((i == 0 && (j % step)) || extras.substr(i * step, step) != indent)
            throw "Inconsistent indentation: `" + 
              line[0].replace(/\t/g, '\\t').replace(/\s/g, '\\s') + 
              "` but `" + 
              baseline.replace(/\t/g, '\\t').replace(/\s/g, '\\s') + 
              "` is a baseline, and `" + 
              indent.replace(/\t/g, '\\t').replace(/\s/g, '\\s') +
              "` is chosen indent level"
        }
      } else if (extras.length) {
        i = 1;
        indent = extras;
      }
      var diff = i - level;
      if (diff > 1)
        throw "Incorrect indentation: A line is " + (i - level) + " levels deeper then previous line";
      if (diff > 0) {
        var block = {type: 'block', value: []};
        if (args) {
          if (!meta.locals) meta.locals = {}
          for (var j = 0, l = args.length, local; j < l; j++)
            if ((local = args[j]) && local.name) meta.locals[local.name] = (meta.locals[local.name] || 0) + 1;
          block.locals = args;
        }
        var object = previous;
        if (object.push) object = object[object.length - 1];
        if (object.type == 'function') object.value.push(block);
        blocks.push(block);
      } else {
        if (diff < 0) {
          blocks.splice(diff)
        }
        if (args) throw "Block arguments were given, but there's no block on next line"
      }
      level = i;
    } else baseline = line[0];
    previous = LSD.Script.parse(line[1], meta, true);
    if (blocks.length) {
      blocks[blocks.length - 1].value.push(previous)
    } else {
      results.push(previous);
    }
    if (line[2]) {
      args = LSD.Script.parse(line[2], meta, true);
      if (!args.push) args = [args];
    } else args = null;
  }
  return results;
};

Parser.Tokens = {'null': null, 'true': true, 'false': false, 'undefined': Parser.undefined};
Parser.rVariable = /^[a-zA-Z][a-zA-Z_\-0-9.\[\]]*$/;
Parser.Combinators = {'+': 1, '>': 1, '!+': 1, '++': 1, '!~': 1, '~~': 1, '&': 1, '&&': 1, '$': 1, '$$': 1};
Parser.rLine = /^([ \t]*)([^\n]*?)\s*(?:\|([^|]*?)\|\s*)?(?:\n|$)/gm
var x = exports.combineRegExp
var OR = '|'
var rRound = "(?:[^()]|\\((?:[^()]|\\((?:[^()]|\\((?:[^()]|\\([^()]*\\))*\\))*\\))*\\))";
var rCurly = "(?:[^{}]|\\{(?:[^{}]|\\{(?:[^{}]|\\{(?:[^{}]|\\{[^{}]*\\})*\\})*\\})*\\})";
var rSquare = "(?:[^\\[\\]]|\\[(?:[^\\[\\]]|\\[(?:[^\\[\\]]|\\[(?:[^\\[\\]]|\\[[^\\[\\]]*\\])*\\])*\\])*\\])";

;(Parser.fn = x("(?:(\\.)\\s*)?([-_a-zA-Z0-9]*)\\s*\\((" + rRound + "*)\\)"))
.names = [     'fn_tail',    'fn',                  'fn_arguments']
;(Parser.block = x("\\s*\\{\\s*(?:\\|\\s*([^|]*)\\|\\s*)?\\s*((?:" + rCurly + ")*)\\s*\\}"))
.names = [                'block_arguments',                'block']
;(Parser.integer = x(/[-+]?\d+/))
;(Parser._float = x(/[-+]?(?:\d+\.\d*|\d*\.\d+)/))
;(Parser._length = x(['(', Parser._float,  OR, Parser.integer, ')', '(em|px|pt|%|fr|deg|(?=$|[^a-zA-Z0-9.]))']))
.names = [            'number',                                     'unit']
;(Parser.comma = x(/\s*,\s*/, 'comma'))
;(Parser.semicolon = x(/\s*;\s*/, 'semicolon'))
;(Parser.whitespace = x(/\s+/, 'whitespace'))
;(Parser.operator = x(/[-+]|[\/%^~=><*\^!|&$]+/, 'operator'))
;(Parser.index = x("\\[\\s*((?:" + rSquare + ")*)\\s*\\]")).names = ['index']
;(Parser.stringDouble = x(/"((?:[^"]|\\")*)"/)).names = ['dstring']
;(Parser.stringSingle = x(/'((?:[^']|\\')*)'/)).names = ['sstring']
;(Parser.string = x([Parser.stringSingle, OR, Parser.stringDouble]))
;(Parser.token = x(/(?:(\.)\s*)?([^$,\s\/().\[\]]+)/)).names = ['token_tail', 'token']

Parser.tokenize = x
(
  [ x(Parser.fn)
  , OR
  , x(Parser.block)
  , OR
  , x(Parser.index)
  , OR
  , x(Parser.semicolon)
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

}(typeof exports != 'undefined' ? exports : this);