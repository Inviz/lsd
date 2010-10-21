/*
---
 
script: Toolbar.Menu.js
 
description: Dropdown menu in a toolbar
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Menu.Toolbar
- ART.Widget.Trait.Menu.Stateful
- Base/Widget.Trait.List
- Base/Widget.Trait.Item.Stateful
- Base/Widget.Trait.Accessibility

provides: [ART.Widget.Menu.Toolbar.Menu, ART.Widget.Menu.Toolbar.Menu.Label]
 
...
*/
ART.Widget.Menu.Toolbar.Menu = new Class({
  Includes: [
    ART.Widget.Button,
    ART.Widget.Trait.Menu.Stateful,
    Widget.Trait.Focus.Stateful,
    Widget.Trait.List, //Look ma, list and item at once!
    Widget.Trait.Item.Stateful,
    Widget.Trait.Accessibility
  ],
  
  events: {
    element: {
      mousedown: 'retain'
    },
    parent: {
      blur: ['detachEvents', 'target'],
      focus: ['attachEvents', 'target']
    },
    target: {
      element: {
        mouseenter: 'retain'
      }
    },
    self: {
      expand: 'unselectItem'
    }
  },
  
  options: {
    menu: {
      position: 'bottom'
    },
    layout: {
      item: 'select-option'
    }
  },
  
  retain: function() {
    this.select();
    return this.parent.apply(this, arguments);
  },
  
  render: Macro.onion(function() {
    if (this.attributes.label && this.attributes.label != this.label) {
      this.label = this.attributes.label;
      this.setContent(this.label)
    }
  }),
  
  processValue: function(item) {
    return item.value;
  }
  
});

Widget.Events.Ignore.push('target');

ART.Widget.Menu.Toolbar.Menu.Label = new Class({
  Extends: ART.Widget.Button
})