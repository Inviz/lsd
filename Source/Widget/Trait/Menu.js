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
    },
    proxies: {
      menu: {
        container: function() {
          return this.menu
        },
        condition: function(widget) {
          return !!widget.setList
        }
      }
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
        cancel: 'collapse'
      }
    }
  },
  
  initialize: function() {
    if (this.events.focus) delete this.events.focus.element.mousedown //nullify retain
    this.parent.apply(this, arguments);
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
  
  getMenu: Macro.setter('menu', function() {
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

ART.Widget.Trait.Menu.State = Class.Stateful({
  'expanded': ['expand', 'collapse']
});
ART.Widget.Trait.Menu.Stateful = [
  ART.Widget.Trait.Menu.State,
  ART.Widget.Trait.Menu
]

Widget.Events.Ignore.push('menu');