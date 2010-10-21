/*
---
 
script: Label.js
 
description: Supplementary field for any kind of widgets that take focus
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Element

provides: [ART.Widget.Label]
 
...
*/

ART.Widget.Label = new Class({
  Extends: ART.Widget.Element,
  
  name: 'label',
  
  options: {
    element: {
      tag: 'label'
    }
  },
  
  events: {
    element: {
      click: 'focusRelatedWidget'
    }
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
    var element = Slick.find(parent, "#" + target)
    console.log(target, element, "#" + target, this.document)
    if (!element) return;
    element.retain();
  }
});

Widget.Attributes.Ignore.push('container');