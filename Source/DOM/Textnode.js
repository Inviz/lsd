/*
---
 
script: Textnode.js
 
description: A representation of a text node
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Node
  - LSD.Struct.Stack

provides: 
  - LSD.Textnode
 
...
*/

LSD.Textnode = LSD.Struct({
  nodeValue: function(value, old, memo) {
    if (!memo || !(memo.push || memo.script)) {
      for (var previous = -1, start, end, bits, substr; (start = value.indexOf('${', previous + 1)) > -1;) {
        if ((end = value.indexOf('}', start)) == -1) continue;
        if (!bits) bits = [];
        if (start > 0 && previous + 1 != start) bits.push(value.substring(previous ? previous + 1 : 0, start));
        bits.push(new LSD.Script({input: value.substring(start + 2, end), placeholder: value.substring(start, end + 1)}));
        previous = end;
      }
    }
    if (!bits) {
      if (this.origin) this.origin.textContent = typeof value == 'undefined' ? '' : value;
      return value;
    } else if (bits.length == 1) return bits[0];
    if (end + 1 < value.length) bits.push(value.substring(end + 1));
    return new LSD.Script({type: 'function', name: 'concat', input: bits, pipable: false});
  },
  parentNode: function(value, old) {
    if (value) this.set('variables', value.variables);
    if (old) this.unset('variables', old.variables)
  }
}).implement(LSD.Node.prototype);
LSD.Textnode.prototype.__initialize = function() {
  for (var i = 0, args = arguments, j = args.length, arg, string; i < j; i++) {
    switch (typeof (arg = args[i])) {
      case "string": case "number":
        if (string == null) string = arg.toString();
        else string += arg;
        break;
      case "object":
        if (arg != null) switch (arg.nodeType) {
          case 3:
            this.origin = arg;
            string = string ? string + arg.nodeValue : arg.nodeValue
            break;
          case 9:
            this.document = this.ownerDocument = arg;
            break;
          case 1:
            break;
          default:
            this.mix(arg);
        }
    }
  }
  if (string != null) this.set('nodeValue', string);
}

LSD.Textnode.prototype.nodeType = 3;
LSD.Textnode.prototype.splitNode = function(i) {
  
}