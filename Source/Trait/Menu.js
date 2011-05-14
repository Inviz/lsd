/*
---
 
script: Menu.js
 
description: Dropdowns should be easy to use.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Trait
  - Widgets/LSD.Widget.Menu.Context

provides:
  - LSD.Trait.Menu
 
...
*/

LSD.Trait.Menu = new Class({      
  options: {
    shortcuts: {
      ok: 'set',
      cancel: 'cancel'
    },
    events: {
      _menu: {
        self: {
          expand: 'makeItems',
          blur: 'collapse',
          next: 'expand',
          previous: 'expand',
          cancel: 'collapse',
          set: 'collapse'
        }
      }
    },
    menu: {
      position: 'top',
      width: 'auto',
      origin: null
    },
    has: {
      one: {
        menu: {
          selector: 'menu[type=context]',
          proxy: function(widget) {
            return widget.pseudos.item;
          }
        }
      }
    },
    states: Array.fast('expanded')
  },
  
  repositionMenu: function() {
    if (!this.menu || this.collapsed) return;
    var top = 0;
    var origin = (this.options.menu.origin == 'document') ? this.document : this;
    if (!origin.size) origin.setSize(true);
    if (!this.menu.size) this.menu.setSize(true);
    var position = LSD.position(origin.size, this.menu.size)
    if (position.x != null) {
      position.x += (this.offset.padding.left || 0) - (this.offset.inside.left || 0) + (this.offset.outside.left || 0);
      this.menu.setStyle('left', position.x);
    }
    if (position.y != null) {
      position.y += (this.offset.padding.top || 0) - (this.offset.inside.top || 0) + (this.offset.outside.top || 0);
      this.menu.setStyle('top', position.y);
    }
    switch (this.options.menu.width) {
      case "adapt": 
        this.menu.setWidth(this.getStyle('width'));
        break;
      case "auto":
        break;
    }
  },
  
  buildMenu: function() {
    return this.buildLayout(this.options.layout.menu);
  },
  
  expand: function() {
    if (!this.menu) {
      this.menu = this.buildMenu();
      this.repositionMenu();
      if (this.hasItems()) this.refresh();
    } else {  
      this.repositionMenu();
    }
    this.menu.show();
  },
  
  collapse: function() {
    if(this.menu) this.menu.hide();
  },
  
  getSelectedOptionPosition: function() {
    return 0
  }
});