/*
---
 
script: Search.js
 
description: Search field with a dropdown
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Input
- ART.Widget.Container
- ART.Widget.Button
- ART.Widget.Trait.Menu
- ART.Widget.Trait.Aware
- Base/Widget.Trait.List
- Base/Widget.Trait.Choice
- Base/Widget.Trait.Value
- Base/Widget.Trait.Observer
- Base/Widget.Trait.Accessibility

provides: [ART.Widget.Input.Search]
 
...
*/

ART.Widget.Input.Search = new Class({
  Includes: [
    ART.Widget.Input,
    ART.Widget.Trait.Menu.Stateful,
    ART.Widget.Trait.Aware,
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
  
  layout: {
    'input-icon#glyph': {},
    'button#canceller': {}
  },
  
  name: 'input',
  
  options: {
    menu: {
      position: 'bottom'
    },
    layout: {
      item: 'input-option'
    }
  },
  
  items: [
    {
      title: 'Google', 
      icon: 'http://www.kew.org/ucm/resources/kew/images/css-images/content/google-icon.gif'
    },
    {
      title: 'Bing',
      icon: 'http://www.microsoft.com/canada/msn/bing/images/bing_icon.png'
    }
  ],
  
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
  
  events: {
    glyph: {
      click: 'expand'
    },
    canceller: {
      click: 'empty'
    },
    self: {
      set: 'setIcon',
      focus: 'expand'
    }
  },
	
  processValue: function(item) {
    return item.value.title;
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
      this.glyph.element.setStyle('background', 'url(' + item + ') no-repeat ' + (this.glyph.offset.paint.left + 4) + 'px ' + this.glyph.offset.paint.left + 'px');
    }
  }
});

ART.Widget.Input.Option = new Class({
  Extends: ART.Widget.Container,
    
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
  
  render: Macro.onion(function() {
    var icon = this.value ? this.value.icon : false;
    if ((this.icon == icon) || !icon) return;
    this.icon = icon;
    this.element.setStyle('background-image', 'url(' + icon + ')');
    this.element.setStyle('background-repeat', 'no-repeat');
    this.element.setStyle('background-position', ((this.offset.paint.left || 0) + 4) + 'px  center');
    this.element.setStyle('padding-left', 15)
  }),
  
  setContent: function(item) {
    this.parent(item.title || item);
  },
  
  select: function() {
    this.listWidget.selectItem.delay(50, this.listWidget, [this]);
  },
  
  chooseOnHover: function() {
    this.listWidget.selectItem(this, true)
  }
});


ART.Widget.Input.Icon = new Class({
  name: 'button', 
  
  Includes: [
    ART.Widget.Button
  ],
  
  layered: {
    icon: ['icon']
  }
});
