/*
---
 
script: Root.js
 
description: The topmost widget easily accessible.
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Mixin
  - LSD.Behavior
 
provides: 
  - LSD.Mixin.Root
 
...
*/

LSD.Mixin.Root = new Class({
  options: {
    events: {
      _root: {
        nodeInserted: function(node) {
          if (!node.root) node.properties.set('root', this);
        },
        nodeRemoved: function(node) {
          if (node.root == this) node.properties.unset('root', this);
        }
      }
    }
  },
  
  onMix: function() {
    this.properties.set('root', this);
  },
  
  onUnmix: function() {
    this.properties.unset('root', this);
  }
});

LSD.Behavior.define(':root', 'root');