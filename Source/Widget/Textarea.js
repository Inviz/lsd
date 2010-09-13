/*
---
 
script: Textarea.js
 
description: Multiline text input
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Input

provides: [ART.Widget.Textarea]
 
...
*/

ART.Widget.Textarea = new Class({
  Extends: ART.Widget.Input,
  
  name: 'textarea',
  
  getInput: function() {
    if (!this.input) this.input = new Element('textarea');
    return this.input;
  }
});