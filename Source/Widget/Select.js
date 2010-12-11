/*
---
 
script: Select.js
 
description: Basic selectbox
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Paint
- LSD.Widget.Button
- LSD.Widget.Container
- LSD.Widget.Trait.Menu
- Base/Widget.Trait.List
- Base/Widget.Trait.Item
- Base/Widget.Trait.Choice
- Base/Widget.Trait.Value
- Base/Widget.Trait.Focus
- Base/Widget.Trait.Accessibility

provides: [LSD.Widget.Select, LSD.Widget.Select.Button, LSD.Widget.Select.Option]
 
...
*/

LSD.Widget.Select = new Class({
  
  Includes: [
    LSD.Widget.Paint,
    LSD.Widget.Trait.Menu.Stateful,
    Widget.Trait.List,
    Widget.Trait.Choice,
    Widget.Trait.Value,
    Widget.Trait.Focus.Stateful,
    Widget.Trait.Accessibility,
    LSD.Widget.Trait.Proxies
  ],
  
  options: {
    tag: 'select',
    layers: {
      shadow:  ['shadow'],
      stroke: ['stroke'],
      background:  [LSD.Layer.Fill.Background],
      reflection:  [LSD.Layer.Fill.Reflection],
      glyph: ['glyph']
    },
    layout: {
      item: 'select-option',
      children: {
        'select-button#button': {}
      }
    },
    events: {
      element: {
        click: 'expand'
      },
      self: {
        set: 'collapse',
        collapse: 'forgetChosenItem'
      },
      expanded: {
        focused: {
          menu: {
            element: {
              'mousemove:on(:item:not(:chosen))': function() {
                this.listWidget.selectItem(this, true)
              },
              'click:on(option)': function() {
                this.listWidget.selectItem(this)
              }
            }
          }
        }
      }
    },
    shortcuts: {
      'ok': 'selectChosenItem'
    },
    menu: {
      position: 'focus',
      width: 'adapt'
    }
  }  
});

LSD.Widget.Select.Button = new Class({
  Extends: LSD.Widget.Button
});

LSD.Widget.Select.Option = new Class({
  Includes: [
    LSD.Widget.Paint,
    Widget.Trait.Value,
    Widget.Trait.Item.Stateful
  ],
  
  States: {
    chosen: ['choose', 'forget']
  },
  
  options: {
    tag: 'option',
    layers: {
      background: LSD.Layer.Fill.Background
    }
  },
  
  getValue: function() {
    return this.attributes.value || this.value || this.parent.apply(this, arguments);
  },
  
  setContent: function() {
    return (this.value = this.parent.apply(this, arguments));
  }
});