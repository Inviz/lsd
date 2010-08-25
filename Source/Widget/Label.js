/*
---
 
script: Label.js
 
description: Supplementary field for any kind of widgets that take focus
 
license: MIT-style license.
 
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
    var hook = $(this.element);
    switch(this.attributes['for']) {
      case "previous":
        hook = hook.getPrevious();
        break;
      case "next":
      default:
        hook = hook.getNext();
        break;
    }
    hook.retrieve('widget').retain();
  }
});

ART.Widget.Ignore.attributes.push('container');