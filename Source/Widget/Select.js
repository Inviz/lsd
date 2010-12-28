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
      item: '^option',
      children: {
        '^button': {}
      }
    },
    events: {
      element: {
        click: 'expand'
      },
      self: {
        set: function(item) {
          console.error('set', item)
          this.setValue(item.getValue());
          this.collapse();
        },
        collapse: 'forgetChosenItem'
      },
      menu: {
        element: {
          'mouseover:on(option)': function() {
            if (!this.chosen) this.listWidget.selectItem(this, true)
          },
          'click:on(option)': function(e) {
            if (!this.selected) {
              this.listWidget.selectItem(this);
              e.stop()
            } else this.listWidget.collapse();
            this.forget()
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
      fill:  ['stroke'],
      reflection:  [LSD.Layer.Fill.Reflection],
      background: [LSD.Layer.Fill.Background],
      glyph: ['glyph']
    }
  },
  
  getValue: function() {
    if (this.attributes && this.attributes.value) this.value = this.attributes.value;
    return this.parent.apply(this, arguments);
  },
  
  setContent: function() {
    return (this.value = this.parent.apply(this, arguments));
  }
});