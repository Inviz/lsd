/*
---

script: Proxies.js

description: Dont adopt children, pass them to some other widget

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Trait
  - LSD.Module.Expectations

provides: 
  - LSD.Trait.Proxies

...
*/

LSD.Trait.Proxies = new Class({
  
  options: {
    proxies: {}
  },
  
  getProxies: Macro.getter('proxies', function() {
    var options = this.options.proxies;
    var proxies = [];
    for (var name in options) proxies.push(options[name]);
    return proxies.sort(function(a, b) {
      return (b.priority || 0) - (a.priority || 0)
    })
  }),
  
  proxyChild: function(child) {
    for (var i = 0, proxies = this.getProxies(), proxy; proxy = proxies[i++];) {
      if (typeof proxy == 'string') proxy = this.options.proxies[proxy];
      if (!proxy.condition.call(this, child)) continue;
      var self = this;
      var reinject = function(target) {
        if (proxy.rewrite === false) {
          self.appendChild(child, function() {
            target.adopt(child);
          });
        } else {
          child.inject(target);
            console.log(child.tagName, target.tagName, child.element, target.element)
        }
      };
      var container = proxy.container;
      if (container.call) {
        if ((container = container.call(this, reinject))) reinject(container);
      } else {
        this.use(container, reinject)
      }
      return true;
    }
  },
  
  canAppendChild: function(child) {
    return !this.proxyChild(child);
  }
  
});