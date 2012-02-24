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
    return value;
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