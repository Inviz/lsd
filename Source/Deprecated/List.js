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
  }
  
});


LSD.Behavior.define(':list', 'list');