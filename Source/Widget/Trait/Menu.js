/*
---
 
script: Menu.js
 
description: Dropdowns should be easy to use.
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Base
- ART.Widget.Menu.Context

provides: [ART.Widget.Trait.Menu, ART.Widget.Trait.Menu.States, ART.Widget.Trait.Menu.Stateful]
 
...
*/

ART.Widget.Trait.Menu = new Class({      
  options: {
    menu: {
      position: 'top'
    },
    layout: {
      menu: 'menu[type=context]#menu'
    }
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
        cancel: 'collapse',
        select: 'expand'
      }
    },
    focus: {
  	  element: {
  	    mousedown: null //nullify retain
  	  }
	  },
  },

  shortcuts: {
    ok: 'set',
    cancel: 'cancel'
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
    this.menu.setStyle('left', this.offset.paint.left);
    this.menu.setWidth(this.getStyle('width'));
  },
  
  buildMenu: function() {
    this.applyLayout(this.options.layout.menu);
  },
  
  getItemWrapper: function() {
    if (!this.menu) this.buildMenu();
    this.repositionMenu();
    return this.menu;
  },
  
  expand: Macro.onion(function() {
    if (!this.menu) this.buildMenu();
    else this.repositionMenu();
    this.menu.show();
  }),
  
  collapse: Macro.onion(function() {
    this.menu.hide();
    //this.repositionMenu();
  }),
  
  getSelectedOptionPosition: $lambda(0)
});

ART.Widget.Trait.Menu.State = Class.Stateful({
  'expanded': ['expand', 'collapse']
});
ART.Widget.Trait.Menu.Stateful = [
  ART.Widget.Trait.Menu.State,
  ART.Widget.Trait.Menu
]

Widget.Events.Ignore.push('menu');