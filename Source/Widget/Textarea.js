/*
---
 
script: Textarea.js
 
description: Multiline text input
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Input

provides: [LSD.Widget.Textarea]
 
...
*/

LSD.Widget.Textarea = new Class({
  Extends: LSD.Widget.Input,
  
  options: {
    tag: 'textarea',
  },
  
  getInput: function() {
    if (!this.input) this.input = new Element('textarea');
    return this.input;
  }
});