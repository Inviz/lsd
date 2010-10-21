/*
---
 
script: Select.js
 
description: Basic selectbox
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Paint
- ART.Widget.Button
- ART.Widget.Container
- ART.Widget.Trait.Menu
- Base/Widget.Trait.List
- Base/Widget.Trait.Choice
- Base/Widget.Trait.Value
- Base/Widget.Trait.Focus
- Base/Widget.Trait.Accessibility

provides: [ART.Widget.Select, ART.Widget.Select.Button, ART.Widget.Select.Option]
 
...
*/

ART.Widget.Select = new Class({
  
  Includes: [
    ART.Widget.Paint,
    ART.Widget.Trait.Menu.Stateful,
    Widget.Trait.List,
    Widget.Trait.Choice,
    Widget.Trait.Value,
    Widget.Trait.Focus.Stateful,
    Widget.Trait.Accessibility,
    ART.Widget.Trait.Proxies
  ],
  
  name: 'select',
  
  layered: {
    shadow:  ['shadow'],
    stroke: ['stroke'],
    background:  ['fill', ['backgroundColor']],
    reflection:  ['fill', ['reflectionColor']],
    glyph: ['glyph']
  },
  
  layout: {
    'select-button#button': {}
  },
  
  options: {
    menu: {
      position: 'focus'
    },
    layout: {
      item: 'select-option'
    }
  },
  
  shortcuts: {
    'ok': 'selectChosenItem'
  },
  
  events: {
    element: {
      click: 'expand'
    },
    self: {
      set: 'collapse',
      collapse: 'forgetChosenItem'
    }
  }
  
});

ART.Widget.Select.Button = new Class({
  Extends: ART.Widget.Button
});

ART.Widget.Select.Option = new Class({
  Includes: [
    ART.Widget.Paint,
    Widget.Trait.Value,
    Widget.Trait.Item.Stateful
  ],
  
  States: {
    chosen: ['choose', 'forget']
  },
  
  events: {
    element: {
      click: 'select',
      mousemove: 'chooseOnHover'
    }
  },
  
  name: 'option',
  
  select: function() {
    this.listWidget.selectItem.delay(20, this.listWidget, [this]);
  },
  
  chooseOnHover: function() {
    this.listWidget.selectItem(this, true)
  },
  
  getValue: function() {
    return this.attributes.value || this.content || this.parent.apply(this, arguments);
  },
  
  setContent: function() {
    return (this.content = this.parent.apply(this, arguments));
  }
});