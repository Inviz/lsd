/*
---

  script: RegExp.js

  description: Parser builder with groupping capabilities and grammar helpers

  license: Public domain (http://unlicense.org).

  authors: Yaroslaff Fedin

  requires:
    - LSD

  provides:
    - LSD.RegExp

...
*/
LSD.RegExp = function(object, callbacks, clean) {
  this.definition = object;
  this.callbacks = callbacks;
  this.clean = clean;
  this.groups = {};
  this.alternatives = {};
  var source = '', re = this, index = 0
  var placeholder = function(all, token, start, input) {
    var value = object[token], left, right;
    if ((value == null || token === name) && typeof (value = re[token]) != 'string') {
      var bits = token.split('_');
      value = (re[bits[0]]) ? re[bits.shift()].apply(re, bits) : token;
    }
    if ((left = input.substring(0, start).match(re.re_left))) left = left[0];
    if ((right = input.substring(start + all.length).match(re.re_right))) right = right[0];
    if (left || right) re.groups[++index] = name;
    if (left && left.charAt(left.length - 1) === '|' && left.charAt(0) !== '\\') 
      re.alternatives[index] = re.groups[index - 1] || re.alternatives[index - 1];
    return value.replace(re.re_reference, placeholder);
  };
  for (var name in object) {
    var old = index, value = object[name];
    var replaced = value.replace(this.re_reference, placeholder)
    var groupped = this.re_groupped.test(value);
    if (old !== index || groupped) source += (source ? '|' : '') + replaced;
    if (old === index && groupped) this.groups[++index] = name;
  }  
  this.source = source;
};
LSD.RegExp.prototype = {
  exec: function(string, callbacks, memo) {
    if (typeof callbacks == 'undefined') callbacks = this.callbacks;
    var regexp = this.compiled || (this.compiled = new RegExp(this.source, "g"));
    var lastIndex = regexp.lastIndex, old = this.stack, res = this.result, groups = this.groups, mem = this.memo;
    if (memo) this.memo = memo;
    regexp.lastIndex = 0;
    for (var match, group, val, args; match = regexp.exec(string);) {
      for (var i = 1, s = null, j = match.length, group = null, val; i <= j; i++) {
        if (group != null && group !== groups[i]) {
          while (!match[i - 1]) i--
          while (!match[s - 1] && !this.alternatives[s] && groups[s - 1] === group) s--
          match = match.slice(s, i);
          if (!callbacks) {
            if (!stack) var stack = this.result = {};
            stack[group] = i - s == 1 ? match[0] : match;
          } else {
            if (!stack) var stack = this.stack = this.result = [];
            if (typeof (val = callbacks[group]) == 'function') 
              val = val.apply(this, match);
            else if (val === true) val = match[0];
            if (typeof val !== 'undefined') this.stack.push(val);
          }
          break;
        } else if (match[i]) {
          if (s == null) s = i;
          if (group == null) group = groups[i];
        }
      }
    }
    var result = this.result;
    regexp.lastIndex = lastIndex;
    this.stack = old;
    this.memo = mem;
    this.result = res;
    if (memo) for (var j = 0, bit; (bit = result[j]) != null; j++) 
      if (bit && bit.length == 1) result[j] = bit[0];
    return (result && result.length == 1) ? result[0] : result;
  },
  inside: function(type, level) {
    var key = Array.prototype.join.call(arguments, '_');
    if (this.insiders[key]) return this.insiders[key];
    var g = this.insides[type], s = '[^' + '\\' + g[0] + '\\' + g[1] + ']'
    for (var i = 1, bit, j = parseInt(level) || 5; i < j; i++)
      s = '(?:[^\\' + g[0] + '\\' + g[1] + ']' + '|\\' + g[0] + s +  '*\\' + g[1] + ')'
    return (this.insiders[key] = s);
  },
  re_reference:  /\<([a-zA-Z][a-zA-Z0-9_]*)\>/g,
  re_left:       /\(\?\:$|[^\\]\|(?=\()*?|\($/,
  re_right:      /\||\)/,
  re_groupped:   /^\([^\?].*?\)$/,
  unicode:       "(?:[\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])",
  string_double: '"((?:[^"]|\\\\")*)"',
  string_single: "'((?:[^']|\\\\')*)'",
  string:        '<string_double>|<string_single>',
  insides: {
    curlies:     ['{', '}'],
    squares:     ['[', ']'],
    parens:      ['(', ')']
  },
  insiders:      {},
  callbacks:     {}
};