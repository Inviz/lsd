/*
---
 
script: List.js
 
description: Mixin that makes it simple to work with a list of item (and select one of them)
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Mixin
  - Core/Element
  - Ext/Element.Properties.item
 
provides: 
  - LSD.Mixin.List
 
...
*/


LSD.Mixin.List = new Class({  
  options: {
    endless: true,
    force: false,
    shortcuts: {
      previous: 'previous',
      next: 'next'
    },
    has: {
      many: {
        items: {
          states: {
            link: {
              checked: 'selected',
              selected: 'checked'
            }
          },
          traits: Array.object('selectable'),
          selector: ':item',
          as: 'list',
          pseudos: Array.object('value'),
          options: function() {
            if (this.attributes.multiple) {
              return {pseudos: Array.object('checkbox')};
            } else {
              return {pseudos: Array.object('radio'), radiogroup: this.lsd};
            }
          },
          callbacks: {
            fill: 'fill',
            empty: 'empty'
          }
        }
      }
    },
    states: Array.object('empty')
  },
  
  findItemByValue: function(value) {
    for (var i = 0, widget; widget = this.items[i++];) {
      var val = widget.value == null ? (widget.getValue ? widget.getValue() : null) : widget.value;
      if (val === value) return this.items[i - 1];
    }
    return null;
  },
  
  sort: function(sort) {
    return this.items.sort(sort)
  },
  
  filter: function(filter) {
    return this.items.filter(filter)
  },
  
  next: function() {
    var index = this.items.indexOf(this.selectedItems[0]);
    var item = this.items[index + 1] || (this.options.endless && this.items[0]);
    return item && item.check();
  },
  
  previous: function() {
    var index = this.items.indexOf(this.selectedItems[0]);
    var item = this.items[index - 1] || (this.options.endless && this.items.getLast());
    return item && item.check();
  }
  
});


LSD.Behavior.define(':list', 'list');