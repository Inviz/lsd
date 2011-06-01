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
          node.root = this;
          node.fireEvent('setRoot', this);
        },
        nodeRemoved: function(node) {
          if (node.root == this) {
            node.fireEvent('unsetRoot', this);
            delete node.root;
          }
        }
      }
    }
  }
});

LSD.Behavior.define(':root', LSD.Mixin.Root);