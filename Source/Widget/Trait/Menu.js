/*
---
 
script: Menu.js
 
description: Dropdowns should be easy to use.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Base
- LSD.Widget.Menu.Context

provides:
- LSD.Widget.Trait.Menu
- LSD.Widget.Trait.Menu.States
- LSD.Widget.Trait.Menu.Stateful
 
...
*/

LSD.Widget.Trait.Menu = new Class({      
  options: {
    layout: {
      menu: 'menu[type=context]#menu'
    },
    shortcuts: {
      ok: 'set',
      cancel: 'cancel'
    },
    events: {
      menu: {
        self: {
          expand: 'makeItems',
          redraw: 'repositionMenu',
          focus: 'repositionMenu',
          blur: 'collapse',
          next: 'expand',
          previous: 'expand',
          cancel: 'collapse'
        }
      }
    },
    proxies: {
      menu: {
        container: 'menu',
        condition: function(widget) {
          return !!widget.setList
        }
      }
    },
    menu: {
      position: 'top',
      width: 'auto'
    }
  },
  
  initialize: function() {
    if (this.options.events.focus) delete this.options.events.focus.element.mousedown //nullify retain
    this.parent.apply(this, arguments);
  },

  cancel: function() {
    this.collapse();
  },

  set: function() {
    this.collapse();
  },
  
  attach: Macro.onion(function() {
    this.addEvents(this.events.menu);
  }),
  
  detach: Macro.onion(function() {
    this.removeEvents(this.events.menu);
  }),
  
  repositionMenu: function() {
    if (!this.menu || this.collapsed) return;
    var top = 0;
    switch (this.options.menu.position) {
      case 'bottom': 
        top = this.getOffsetHeight() + ((this.offset.padding.top || 0) - (this.offset.inside.top || 0)) + 1;
        break;
      case 'center':
        top = - (this.getOffsetHeight() + ((this.offset.padding.top || 0) - (this.offset.inside.top || 0))) / 2;
        break;
      case 'focus':
        top = - this.getSelectedOptionPosition();
        break;
      default:
    }
    this.menu.setStyle('top', top);
    this.menu.setStyle('left', this.offset.outside.left);
    switch (this.options.menu.width) {
      case "adapt": 
        this.menu.setWidth(this.getStyle('width'));
        break;
      case "auto":
        break;
    }
  },
  
  getMenu: Macro.getter('menu', function() {
    return this.buildLayout(this.options.layout.menu);
  }),
  
  expand: Macro.onion(function() {
    if (!this.menu) {
      this.getMenu();
      this.repositionMenu();
      if (this.hasItems()) this.refresh();
    } else {  
      this.repositionMenu();
    }
    if (this.hasItems()) this.menu.show();
    else this.menu.hide();
  }),
  
  collapse: Macro.onion(function() {
    if (this.menu) this.menu.hide();
    //this.repositionMenu();
  }),
  
  getSelectedOptionPosition: $lambda(0)
});

LSD.Widget.Trait.Menu.State = Class.Stateful({
  'expanded': ['expand', 'collapse']
});
LSD.Widget.Trait.Menu.Stateful = [
  LSD.Widget.Trait.Menu.State,
  LSD.Widget.Trait.Menu
]

Widget.Events.Ignore.push('menu');