/*
---
 
script: Comment.js
 
description: A comment node. 
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Struct.Stack
  - LSD.Node

provides: 
  - LSD.Comment
 
...
*/

LSD.Comment = LSD.Struct()
LSD.Comment.implement(LSD.Node.prototype);
LSD.Comment.prototype.__initialize = function(string, options) {
  this.nodeValue = string;
};
LSD.Comment.prototype.cloneNode = function() {
  return new (this.constructor)(this.nodeValue);
};
LSD.Comment.prototype.nodeType = 8;
/*
  LSD allows comments be used as boundaries for conditional blocks.
  A block of layout may contain text, elements and even other
  conditional blocks. If both outer and inner blocks are 
  predicted to be not displayed at the render time, each block is
  wrapped in comments creating a nested comment which is not allowed
  in html so parser "cuts" the outer block as soon as it meets the 
  nested comment. To work around this, the nested comment may use
  a "shortened" <!- -!> comment syntax, that does not mess with outer
  comment. Nested comment is expanded when the outer block is rendered.
  
    <!--
      Outer comment
      <!- Nested comment ->
    -->
*/
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