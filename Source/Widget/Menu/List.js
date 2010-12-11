/*
---
 
script: List.js
 
description: Menu widget to be used as a list of item
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Menu
- Base/Widget.Trait.Item
- Base/Widget.Trait.List
- Base/Widget.Trait.Focus
- Base/Widget.Trait.Accessibility

provides:
- LSD.Widget.Menu.List
- LSD.Widget.Menu.List.Item
 
...
*/
LSD.Widget.Menu.List = new Class({
  Includes: [
    LSD.Widget.Menu,
    Widget.Trait.List,
    Widget.Trait.Focus.Stateful,
    Widget.Trait.Accessibility,
    LSD.Widget.Trait.Proxies
  ],
  
  options: {
    attributes: {
      type: 'list'
    },
    layout: {
      item: 'menu-list-item'
    },
    events: {
      self: {
        dominject: 'makeItems'
      },
      element: {
        'click:on(option)': function() {
          this.listWidget.selectItem(this)
        }
      }
    }
  }
});
    

LSD.Widget.Menu.List.Option = new Class({
  Includes: [
    LSD.Widget.Paint,
    Widget.Trait.Item.Stateful
  ],
  
  options: {
    tag: 'option',
    layers: {
      fill:  ['stroke'],
      reflection:  [LSD.Layer.Fill.Reflection],
      background: [LSD.Layer.Fill.Background]
    }
  }
});

LSD.Widget.Menu.List.Button = LSD.Widget.Menu.List.Li = LSD.Widget.Menu.List.Command = LSD.Widget.Menu.List.Option;