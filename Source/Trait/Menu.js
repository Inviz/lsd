/*
---
 
script: Menu.js
 
description: Dropdowns should be easy to use.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - Widgets/LSD.Widget.Menu.Context

provides:
  - LSD.Trait.Menu
  - LSD.Trait.Menu.States
  - LSD.Trait.Menu.Stateful
 
...
*/

LSD.Trait.Menu = new Class({      
  options: {
    layout: {
      menu: 'menu[type=context]#menu'
    },
    shortcuts: {
      ok: 'set',
      cancel: 'cancel'
    },
    events: {
      _menu: {
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

  cancel: function() {
    this.collapse();
  },

  set: function() {
    this.collapse();
  },
  
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
  
  expand: function() {
    if (!this.menu) {
      this.getMenu();
      this.repositionMenu();
      if (this.hasItems()) this.refresh();
    } else {  
      this.repositionMenu();
    }
    if (this.hasItems()) this.menu.show();
    else this.menu.hide();
  },
  
  collapse: function() {
    if (this.menu) this.menu.hide();
    //this.repositionMenu();
  },
  
  getSelectedOptionPosition: function() {
    return 0
  }
});

LSD.Trait.Menu.State = Class.Stateful({
  'expanded': ['expand', 'collapse']
});
LSD.Trait.Menu.Stateful = [
  LSD.Trait.Menu,
  LSD.Trait.Menu.State
]