/*
---
 
script: Textnode.js
 
description: A representation of a text node
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Node
  - LSD.Struct
  - LSD.Journal

provides: 
  - LSD.Textnode
 
...
*/

LSD.Textnode = LSD.Struct({
  textContent: function(value, old, meta) {
    if (typeof value != 'undefined') {
      value = String(value)
      if (!meta || !(meta.push || meta.script)) {
        for (var previous = -1, start, end, bits, substr; (start = value.indexOf('${', previous + 1)) > -1;) {
          if ((end = value.indexOf('}', start)) == -1) continue;
          if (!bits) bits = [];
          if (start > 0 && previous + 1 != start) bits.push(value.substring(previous ? previous + 1 : 0, start));
          bits.push(new LSD.Script({input: value.substring(start + 2, end), placeholder: value.substring(start, end + 1)}));
          previous = end;
        }
      }
    }
    if (!bits) {
      if (this.origin) this.origin.textContent = typeof value == 'undefined' ? '' : value;
      for (var node = this; node = node.parentNode;) {
        var children = node.childNodes;
        var content = children.textContent;
        if (content != null) {
          for (var text = '', child, i = 0; child = children[i++];)
            if (child.textContent != null) text += child.textContent;
          node.set('textContent', text, 'textContent');
          node.unset('textContent', content, 'textContent');
          children.textContent = text;
        }
      }
      return value;
    } else if (bits.length == 1) return bits[0];
    if (end + 1 < value.length) bits.push(value.substring(end + 1));
    return new LSD.Script({type: 'function', name: 'concat', input: bits, pipable: false});
  },
  parentNode: function(value, old, meta) {
    this.mix('variables', value && value.variables, meta, old && old.variables, true);
  }
}, 'Journal');
LSD.Textnode.implement(LSD.Node.prototype);
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
            string = string ? string + arg.textContent : arg.textContent
            break;
          case 9:
            this.document = this.ownerDocument = arg;
            break;
          case 1:
            break;
          case 11: case 7:
            this.fragment = arg;
            break;
          default:
            this.mix(arg);
        }
    }
  }
  if (string != null) this.set('textContent', string);
  this.uid = LSD.Textnode.uid = (LSD.Textnode.uid || (LSD.Textnode.uid = 0)) + 1;
}

LSD.Textnode.prototype.nodeType = 3;
LSD.Textnode.prototype.splitNode = function(i) {
  
}