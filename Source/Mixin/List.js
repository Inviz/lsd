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
    proxies: {
      container: {
        condition: function(widget) {
          return !!widget.setList
        }
      }
    },
    shortcuts: {
      previous: 'previous',
      next: 'next'
    },
    has: {
      many: {
        items: {
          selector: ':item',
          scopes: {
            selected: {
              filter: ':selected',
              callbacks: {
                add: function(widget) {
                  if (this.setValue) this.setValue(widget);
                  this.fireEvent('set', widget);
                },
                remove: function(widget) {
                  if (widget.getCommandType() != 'checkbox') return;
                  if (this.setValue) this.setValue(widget, true);
                  this.fireEvent('unset', widget);
                }
              }
            }
          },
          as: 'listWidget',
          pseudos: Array.fast('value', 'command'),
          states: {
            link: {
              checked: 'selected'
            },
            add: Array.fast('selected')
          },
          callbacks: {
            fill: 'fill',
            empty: 'empty'
          },
          options: function() {
            if (this.attributes.multiple) {
              return {pseudos: {checkbox: true}};
            } else {
              return {pseudos: {radio: true}, radiogroup: this.lsd};
            }
          }
        }
      }
    },
    states: {
      empty: true
    }
  },
  
  findItemByValue: function(value) {
    for (var i = 0, widget; widget = this.items[i++];) {
      var val = widget.value == null ? (widget.getValue ? widget.getValue() : null) : widget.value;
      if (val === value) return this.items[i];
    }
    return null;
  },
  
  sort: function(sort) {
    return this.getItems().sort(sort)
  },
  
  filter: function(filter) {
    return this.getItems().filter(filter)
  }
  
});

LSD.Behavior.define(':list', LSD.Mixin.List);