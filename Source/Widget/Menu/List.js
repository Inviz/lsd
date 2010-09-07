/*
---
 
script: List.js
 
description: Menu widget to be used as a list of item
 
license: MIT-style license.
 
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
    Widget.Trait.Focus,
    Widget.Trait.Accessibility
  ],
  
	events: {
	  element: {
  	  mousedown: 'retain'
	  },
	  self: {
	    dominject: 'makeItems'
	  }
	},
	
	options: {
	  list: {
	    item: 'menu-list-item'
	  }
	},

  attributes: {
    type: 'list'
  },

	buildItem: function(item) {
	  var widget = this.buildLayout(this.options.list.item, item.toString(), this, false);
	  widget.value = item;
	  widget.setList(this);
	  this.getContainer().append(widget); 
	  return widget;
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