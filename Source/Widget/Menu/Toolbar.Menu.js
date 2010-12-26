/*
---
 
script: Toolbar.Menu.js
 
description: Dropdown menu in a toolbar
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Menu.Toolbar
- LSD.Widget.Trait.Menu.Stateful
- Base/Widget.Trait.List
- Base/Widget.Trait.Item.Stateful
- Base/Widget.Trait.Accessibility

provides:
- LSD.Widget.Menu.Toolbar.Menu
- LSD.Widget.Menu.Toolbar.Menu.Label
 
...
*/
LSD.Widget.Menu.Toolbar.Menu = new Class({
  Includes: [
    LSD.Widget.Button,
    LSD.Widget.Trait.Menu.Stateful,
    Widget.Trait.Focus.Stateful,
    Widget.Trait.List, //Look ma, list and item at once!
    Widget.Trait.Item.Stateful,
    Widget.Trait.Accessibility,
    LSD.Widget.Trait.Proxies
  ],
  
  options: {
    layout: {
      item: 'menu-context-item'
    },
    events: {
      element: {
        mousedown: 'retain'
      },
      parent: {
        blur: function() {
          this.removeEvents(this.events );
        },
        focus: function() {
          this.addEvents(this.events.target);
        }
      },
      menu: {
        element: {
          'mousemove:on(command)': function() {
            if (!this.chosen) this.listWidget.selectItem(this)
          },
          'click:on(command)': function() {
            if (!this.selected) this.listWidget.selectItem(this)
            this.listWidget.collapse();
          }
        }
      },
      target: {
        element: {
          mouseenter: 'retain'
        }
      },
      self: {
        click: 'expand',
        expand: 'unselectItem'
      }
    },
    menu: {
      position: 'bottom'
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

LSD.Widget.Menu.Toolbar.Menu.Label = new Class({
  Extends: LSD.Widget.Button
});

LSD.Widget.Menu.Toolbar.Menu.Command = LSD.Widget.Menu.Context.Command;
LSD.Widget.Menu.Toolbar.Menu.Command.Command = LSD.Widget.Menu.Context.Command;
LSD.Widget.Menu.Toolbar.Menu.Command.Checkbox = LSD.Widget.Menu.Context.Checkbox
LSD.Widget.Menu.Toolbar.Menu.Command.Radio = LSD.Widget.Menu.Context.Radio;