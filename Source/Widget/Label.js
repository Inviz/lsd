/*
---
 
script: Label.js
 
description: Supplementary field for any kind of widgets that take focus
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Element

provides: [LSD.Widget.Label]
 
...
*/

LSD.Widget.Label = new Class({
  Extends: LSD.Widget.Element,
  
  options: {
    tag: 'label',
    element: {
      tag: 'label'
    },
    events: {
      element: {
        click: 'focusRelatedWidget'
      }
    },
  },
  
  getInput: function() {
    if (!this.input) this.input = new Element('textarea');
    return this.input;
  },
  
  focusRelatedWidget: function() {
    var parent = this;
    var target = this.attributes['for'];
    if (!target || target.match(/\^s*$/)) return;
    
    while (parent.parentNode && parent.parentNode != this.document) parent = parent.parentNode; //search by id in topmost widget
    var element = parent.getElement("#" + target);
    if (!element) return;
    if (element.retain) element.retain();
    if (element.click) element.click();
  }
});