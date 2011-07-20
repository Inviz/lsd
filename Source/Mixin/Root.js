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
          node.fireEvent('register', ['root', this]);
          node.fireEvent('relate', [this, 'root']);
        },
        nodeRemoved: function(node) {
          if (node.root == this) {
            node.fireEvent('unsetRoot', this);
            node.fireEvent('unregister', ['root', this]);
            node.fireEvent('unrelate', [this, 'root']);
            delete node.root;
          }
        }
      }
    }
  },
  
  constructors: {
    root: function() {
      this.root = this;
      this.fireEvent('setRoot', this);
      this.fireEvent('relate', [this, 'root']);
      this.fireEvent('register', ['root', this]);
    }
  },
  
  desconstructors: {
    root: function() {
      delete this.root;
      this.fireEvent('unsetRoot', this);
      this.fireEvent('unregister', ['root', this]);
      this.fireEvent('unrelate', [this, 'root']);
    }
  }
});

LSD.Behavior.define(':root', LSD.Mixin.Root);