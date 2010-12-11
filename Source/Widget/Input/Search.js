/*
---
 
script: Search.js
 
description: Search field with a dropdown
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Input
- LSD.Widget.Container
- LSD.Widget.Button
- LSD.Widget.Trait.Menu
- Base/Widget.Trait.List
- Base/Widget.Trait.Choice
- Base/Widget.Trait.Value
- Base/Widget.Trait.Observer
- Base/Widget.Trait.Accessibility

provides: [LSD.Widget.Input.Search]
 
...
*/

LSD.Widget.Input.Search = new Class({
  Includes: [
    LSD.Widget.Input,
    LSD.Widget.Trait.Expectations,
    LSD.Widget.Trait.Proxies,
    LSD.Widget.Trait.Menu.Stateful,
    Widget.Trait.List,
    Widget.Trait.Choice,
    Widget.Trait.Value,
    Widget.Trait.Observer.Stateful,
    Widget.Trait.Accessibility
  ],
  
  States: {
    'detailed': ['enrich', 'clean'],
    'uniconed': ['uniconize', 'iconize']
  },
  
  options: {
    tag: 'input',
    layout: {
      item: 'input-option',
      children: {
        '>icon#glyph': {},
        '>button#canceller': {}
      }
    },
    events: {
      glyph: {
        click: 'expand'
      },
      canceller: {
        click: 'clear'
      },
      self: {
        set: 'setIcon',
        focus: 'expand'
      }
    },
    menu: {
      position: 'bottom'
    }
  },
  
  attach: Macro.onion(function() {
    if (this.hasItems()) {
      this.enrich();
    } else {
      this.clean();
    }
  }),
  
  setInputSize: Macro.onion(function() {
    if (!this.resorted && this.glyph.element.parentNode) {
      this.resorted = true;
      $(this.input).inject(this.glyph, 'after')
    }
    if (this.canceller) this.canceller.refresh();
    this.input.setStyle('width', this.size.width - this.canceller.getLayoutWidth(this.canceller.size.width) - this.glyph.getLayoutWidth() - 1)
  }),
	
  processValue: function(item) {
    return item.value.title;
  },
  
  clear: function() {
    this.empty();
    this.focus();
  },
  
  applyValue: $lambda(true),
  
  setIcon: function(item) {
    if (item && item.value) item = item.value.icon;
    this.collapse();
    if (!item) {
      this.iconize();
      this.glyph.element.setStyle('background-image', '');
    } else {
      this.uniconize();
      this.glyph.element.setStyle('background', 'url(' + item + ') no-repeat ' + (this.glyph.offset.outside.left + 4) + 'px ' + this.glyph.offset.outside.left + 'px');
    }
  }
});

LSD.Widget.Input.Option = LSD.Widget.Input.Search.Option = new Class({
  Extends: LSD.Widget.Container,
    
  States: {
    chosen: ['choose', 'forget']
  },
  
  options: {
    tag: 'option',
    events: {
      element: {
        click: 'select',
        mousemove: 'chooseOnHover'
      }
    }
  },
  
  render: Macro.onion(function() {
    var icon = this.value ? this.value.icon : false;
    if ((this.icon == icon) || !icon) return;
    this.icon = icon;
    this.element.setStyle('background-image', 'url(' + icon + ')');
    this.element.setStyle('background-repeat', 'no-repeat');
    this.element.setStyle('background-position', ((this.offset.outside.left || 0) + 4) + 'px  center');
    this.element.setStyle('padding-left', 15)
  }),
  
  select: function() {
    this.listWidget.selectItem.delay(50, this.listWidget, [this]);
  },
  
  chooseOnHover: function() {
    this.listWidget.selectItem(this, true)
  }
});


LSD.Widget.Input.Icon = LSD.Widget.Input.Search.Icon = new Class({
  
  Includes: [
    LSD.Widget.Button
  ],
  
  options: {
    tag: 'button',
    layers: {
      icon: ['icon']
    }
  }
  
});

LSD.Widget.Input.Search.Button = LSD.Widget.Button;