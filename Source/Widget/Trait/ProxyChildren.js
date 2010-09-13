/*
---
 
script: ProxyChildren.js
 
description: Dont adopt children, pass them to some other widget
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Trait.Aware

provides: [ART.Widget.Trait.ProxyChildren]
 
...
*/

ART.Widget.Trait.ProxyChildren = new Class({
  options: {
    proxy: {
      target: false
    }
  },
  
  getProxyTarget: Macro.defaults(function() {
    return this.options.proxy.target && this[this.options.proxy.target]
  }),
  
  appendChild: function(child) {
    if (this.canAppendChild(child)) {
      this.parent.apply(this, arguments);
      var target = this.getProxyTarget();
      if (target) this.proxied.each(function(args) {
        target.appendChild.apply(target, args);
      });
      return true
    } else {
      if (!this.proxied) this.proxied = [];
      this.proxied.push(arguments);
      return false;
    }
  },
  
  canAppendChild: function(child) {
    return child.name == 'menu'
  }
  
});
