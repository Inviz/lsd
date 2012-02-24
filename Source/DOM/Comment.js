/*
---
 
script: Comment.js
 
description: A comment node. 
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Struct.Stack

provides: 
  - LSD.Comment
 
...
*/

LSD.Comment = LSD.Struct.Stack({});
LSD.Comment.prototype.__initialize = function(string, options) {
  
}
LSD.Comment.prototype.nodeType = 8;
LSD.Comment.prototype.expand = function() {
  var depth = 0;
  text = text.replace(this.rCollapsed, function(whole, start, end) {
    depth += (start ? 1 : -1);
    if (depth == !!start) return start ? '<!--' : '-->'
    return whole;
  });
  if (depth) throw "The comment is unbalanced"
  return text;
}

// Match boundaries of comments that use short notation, e.g. `<!- ->` 
LSD.Comment.prototype.rCollapsed = /(\<\!-)|(-\>)/g