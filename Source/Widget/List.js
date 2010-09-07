/*
---
 
script: List.js
 
description: List widget to render (and select) various items
 
license: MIT-style license.
 
requires:
- ART.Widget.Menu.List
- Base/Widget.Trait.List
- Base/Widget.Trait.Item
- Base/Widget.Trait.Focus
- Base/Widget.Trait.Accessibility

provides: [ART.Widget.List]
 
...
*/

ART.Widget.List = new Class({
  Includes: [
    ART.Widget.Menu.List,
    Widget.Trait.Focus,
    Widget.Trait.Accessibility
  ],
  
  name: 'list',
	
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

  	buildItem: function(item) {
  	  var widget = this.buildLayout(this.options.list.item, item.toString(), this, false);
  	  widget.value = item;
  	  widget.setList(this);
  	  this.getContainer().append(widget); 
  	  return widget;
  	},

	layered: {
	  shadow:  ['shadow'],
	  background:  ['fill', ['backgroundColor']]
	},
	
	processValue: function(item) {
	  return item.value;
	}
	
});