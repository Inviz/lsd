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
          if (!node.root) node.objects.set('root', this);
        },
        nodeRemoved: function(node) {
          if (node.root == this) node.objects.unset('root', this);
        }
      }
    }
  },
  
  onMix: function() {
    this.objects.set('root', this);
  },
  
  onUnmix: function() {
    this.objects.unset('root', this);
  }
});

LSD.Behavior.define(':root', 'root');