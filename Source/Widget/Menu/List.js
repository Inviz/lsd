/*
---
 
script: List.js
 
description: Menu widget to be used as a list of item
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Menu
- Base/Widget.Trait.Item
- Base/Widget.Trait.List
- Base/Widget.Trait.Focus
- Base/Widget.Trait.Accessibility

provides: [ART.Widget.Menu.List, ART.Widget.Menu.List.Item]
 
...
*/
ART.Widget.Menu.List = new Class({
  Includes: [
    ART.Widget.Menu,
    Widget.Trait.List,
    Widget.Trait.Focus.Stateful,
    Widget.Trait.Accessibility,
    ART.Widget.Trait.Proxies
  ],
  
  events: {
    self: {
      dominject: 'makeItems'
    }
  },
  
  options: {
    layout: {
      item: 'menu-list-item'
    }
  },

  attributes: {
    type: 'list'
  }
  
});
    

ART.Widget.Menu.List.Item = new Class({
  Includes: [
    ART.Widget.Paint,
    Widget.Trait.Item.Stateful
  ],
  
  events: {
    element: {
      mousedown: 'select'
    }
  },
  
  name: 'item',
  
  layered: {
    fill:  ['stroke'],
    reflection:  ['fill', ['reflectionColor']],
    background: ['fill', ['backgroundColor']]
  }
});