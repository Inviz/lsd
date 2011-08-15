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
  }
});

Object.append(LSD.Module.Proxies, {
  match: function(node, proxy, parent) {
    if (node.lsd) {
      if (!node.element) node.toElement();
      if (proxy.selector) return proxy.selector === true || node.match(proxy.selector);
    } else {
      if (proxy.mutation) return proxy.mutation === true || (node.nodeType == 1 && Slick.matchNode(node, proxy.mutation, parent || proxy.element))
      if (proxy.text) return node.nodeType == 3;
    }
  },
  
  invoke: function(parent, child, proxy, memo) {
    if (proxy.callback) proxy.callback.call(parent, child, proxy, memo);
    var container = proxy.container && proxy.container.call ? proxy.container.call(parent, child, proxy) : proxy.container;
    if (container === false) {
      if (!proxy.queued) proxy.queued = [];
      proxy.queued.push(child);
      if (child.parentNode) child.parentNode.removeChild(child);
      return false;
    }
    var result = {};
    if (container && container !== true) {
      if (child.lsd) {
        if (container.localName) {
          result.override = function(parent, child) {
            container.appendChild(child);
          }
        }
        if (container.lsd) result.parent = container;
        else result.parent = [parent[0] || parent, container];
        if (proxy.rewrite === false) result.parent[0] == parent[0] || parent;
      } else {
        result.parent = container;
      }
    }
    if (proxy.before) result.before = proxy.before.call ? proxy.before.call(parent, child, proxy) : proxy.before;
    else if (proxy.after) {
      var after = (proxy.after.call ? proxy.after.call(parent, child, proxy) : proxy.after);
      if (after) result.before = after.nextSibling;
    }
    return result;
  }
});

LSD.Module.Proxies.events = {
  appendChild: function(child) {
    
  }
}

LSD.Options.proxies = {
  add: 'addProxy',
  remove: 'removeProxy',
  iterate: true
};