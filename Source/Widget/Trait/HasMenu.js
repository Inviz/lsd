

ART.Widget.Trait.HasMenu = new Class({	
  Includes: [
    Widget.Trait.OuterClick
  ],
  
  options: {
    menu: {
      position: 'top'
    }
  },
  
  events: {
    outer: {
      element: {
        outerClick: 'collapse'
      }
    },
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
  
  repositionMenu: function(once) {
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
    this.menu.setStyle('width', this.getStyle('width'));
    //if (!once) arguments.callee.delay(30, this, true)
  },
  
  buildMenu: function() {
    this.applyLayout('menu#menu');
  },
  
  expand: Macro.onion(function() {
    if (!this.menu) this.buildMenu();
    this.repositionMenu();
    this.menu.refresh();
    this.menu.show();
    this.attachOuterClick();
  }),
  
  collapse: Macro.onion(function() {
    this.menu.hide();
    //this.repositionMenu();
    //this.detachOuterClick();
  }),
  
  getSelectedOptionPosition: $lambda(0)
});

ART.Widget.Ignore.events.push('menu')