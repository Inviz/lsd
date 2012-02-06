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
  initialize: function(string, options) {
    
  },
  
  parentNode: function() {
    
  },
  
  nodeValue: function() {
    
  }
})

LSD.Textnode.prototype.nodeType = 3;