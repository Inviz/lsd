/*
---

script: Proxies.js

description: Dont adopt children, pass them to some other widget

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module.DOM

provides: 
  - LSD.Module.Proxies

...
*/
  
LSD.Module.Proxies = new Class({
  constructors: {
    proxies: function() {
      this.proxies = [];
    }
  },
  
  addProxy: function(name, proxy) {
    for (var i = 0, other; (other = this.proxies[i]) && ((proxy.priority || 0) < (other.priority || 0)); i++);
    this.proxies.splice(i, 0, proxy);
  },
  
  removeProxy: function(name, proxy) {
    this.proxies.erase(proxy);
  },
  
  proxyChild: function(child) {
    for (var i = 0, proxy; proxy = this.proxies[i++];) {
      if (!proxy.condition.call(this, child)) continue;
      var self = this;
      var reinject = function(target) {
        var where = proxy.where && proxy.where.call ? proxy.where.call(self, child) : proxy.where;
        if (proxy.rewrite === false) {
          self.appendChild(child, function() {
            target.grab(child, where);
          }, true);
        } else {
          child.inject(target, where);
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
  
  appendChild: function(widget, adoption, proxy) {
    var element = widget.element || widget;
    var parent = element.parentNode;
    if (proxy !== true && !this.canAppendChild(widget)) {
      if (element == parent) {
        if (widget.parentNode) widget.dispose();
        else if (widget.element.parentNode) widget.element.dispose();
      }
      return false;
    };
    return LSD.Module.DOM.prototype.appendChild.call(this, widget, adoption);
  },
  
  canAppendChild: function(child) {
    return !this.proxyChild(child);
  }
  
});

LSD.Options.proxies = {
  add: 'addProxy',
  remove: 'removeProxy',
  iterate: true
};