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
    Widget.Trait.List, //Look ma, list and item at once!
    Widget.Trait.Item.Stateful,
    Widget.Trait.Accessibility
  ],
  
  events: {
    element: {
      mousedown: 'select'
    },
    parent: {
      blur: ['detachEvents', 'target'],
      focus: ['attachEvents', 'target']
    },
    target: {
      element: {
        mousemove: 'select'
      }
    },
    self: {
      inject: 'setList',
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
  
  render: Macro.onion(function() {
    if (this.attributes.label) this.setContent(this.attributes.label)
  }),
  
  buildItem: function(item) {
    if (!this.menu) this.buildMenu();
    var widget = this.buildLayout(this.options.layout.item, item.toString(), this.menu);
    widget.value = item;
    widget.selectWidget = this;
    return widget;
  },
  
  processValue: function(item) {
    return item.value;
  },
  
  getItemWrapper: function() {
    return this.menu;
  }
  
});

Widget.Ignore.events.push('target');

ART.Widget.Menu.Toolbar.Menu.Label = new Class({
  Extends: ART.Widget.Button
})