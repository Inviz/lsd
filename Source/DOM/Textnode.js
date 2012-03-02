/*
---
 
script: Textnode.js
 
description: A representation of a text node
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Struct.Stack

provides: 
  - LSD.Textnode
 
...
*/

LSD.Textnode = LSD.Struct({
  nodeValue: function(value) {
    for (var previous = -1, start, end, bits; (start = value.indexOf('${', previous + 1)) > -1;) {
      if ((end = value.indexOf('}', start)) == -1) continue;
      if (!bits) bits = [];
      if (start > 0 && previous != start) bits.push(value.substring(previous || 0, start));
      bits.push(new LSD.Script(value.substring(start + 2, end)));
      previous = end;
    }
    if (bits) {
      if (end + 1 < value.length) bits.push(value.substring(end + 1));
      return new LSD.Script({type: 'function', name: 'concat', input: bits});
    } else return value;
  },
  parentNode: function(value, old) {
    if (value) this.set('variables', value.variables);
    if (old) this.unset('variables', old.variables)
  }
})
LSD.Textnode.prototype.__initialize = function() {
  for (var i = 0, args = arguments, j = args.length, arg, string; i < j; i++) {
    switch (typeof (arg = args[i])) {
      case "string": case "number":
        if (string == null) string = arg.toString();
        else string += arg;
        break;
      case "object":
        if (arg != null) {
          if (arg.nodeType === 3) string = string ? string + arg.nodeValue : arg.nodeValue
        } else this.mix(arg);
    }
  }
  if (string != null) this.set('nodeValue', string);
}

LSD.Textnode.prototype.nodeType = 3;
LSD.Textnode.prototype.splitNode = function(i) {
  
}