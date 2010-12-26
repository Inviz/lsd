/*
---
 
script: Proxies.js
 
description: Dont adopt children, pass them to some other widget
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Module.Expectations

provides: [LSD.Widget.Trait.Proxies]
 
...
*/

LSD.Widget.Trait.Proxies = new Class({
  
  options: {
    proxies: {}
  },
  
  getProxies: Macro.getter('proxies', function() {
    var options = this.options.proxies;
    var proxies = []
    for (var name in options) proxies.push(options[name]);
    return proxies.sort(function(a, b) {
      return (b.priority || 0) - (a.priority || 0)
    })
  }),
  
  proxyChild: function(child, proxy) {
    if (typeof proxy == 'string') proxy = this.options.proxies[proxy];
    if (!proxy.condition.call(this, child)) return false;
    var reinject = function(target) {
      if (proxy.rewrite === false) {
        this.appendChild(child, function() {
          target.adopt(child);
        });
      } else {
        child.inject(target);
      }
    };
    var container = proxy.container;
    if (container.call) {
      reinject.call(this, container.call(this));
    } else {
      this.use(container, reinject.bind(this))
    }
    return true;
  },
  
  canAppendChild: function(child) {
    for (var i = 0, proxies = this.getProxies(), proxy; proxy = proxies[i++];) if (this.proxyChild(child, proxy)) return false;
    return true;
  }
  
});