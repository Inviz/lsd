/*
---

script: Proxies.js

description: Dont adopt children, pass them to some other widget

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module

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
    var selector = proxy.selector || proxy.mutation;
    if (selector && selector !== true && selector.match(LSD.Module.Proxies.rOrdered)) 
      var object = this.parentNode;
    else 
      var object = this;
    for (var i = 0, other; (other = object.proxies[i]) && ((proxy.priority || 0) < (other.priority || 0)); i++);
    object.proxies.splice(i, 0, proxy);
  },
  
  removeProxy: function(name, proxy) {
    var selector = proxy.selector || proxy.mutation;
    if (selector && selector !== true && selector.match(LSD.Module.Proxies.rOrdered)) 
      var object = this.parentNode;
    else 
      var object = this;
    var index = object.proxies.indexOf(proxy);
    if (index > -1) object.proxies.splice(index, 1);
  }
});

LSD.Module.Proxies.rOrdered = /^\s*[+~]/;

Object.append(LSD.Module.Proxies, {
  match: function(node, proxy, parent) {
    if (node.lsd) {
      if (!node.element) node.toElement();
      if (proxy.selector) return proxy.selector === true || Slick.matchNode(node, proxy.selector, parent || proxy.widget);
    } else {
      if (proxy.mutation) return proxy.mutation === true || (node.nodeType == 1 && Slick.matchNode(node, proxy.mutation, parent || proxy.element))
      if (proxy.text) return node.nodeType == 3;
    }
  },
  
  invoke: function(parent, child, proxy) {
    if (proxy.callback) proxy.callback.call(parent, child, proxy);
    var container = proxy.container && proxy.container.call ? proxy.container.call(parent, child, proxy) : proxy.container;
    if (container === false) {
      if (!proxy.queued) proxy.queued = [];
      proxy.queued.push(child);
      return false;
    }
    var result = {};
    if (container && container !== true) {
    if (container.localName) {
      result.element = container;
      if (proxy.rewrite === false) result.widget = parent[0] || parent;
    } else if (container.lsd) {
      result.widget = container;
      result.element = container.element || container.toElement()
    } else {
      result.widget = parent[0] || parent;
      result.element = container;
    }
      if (container === child) return false;
    }
    if (proxy.before) {
      result.before = proxy.before.call ? proxy.before.call(parent, child, proxy) : proxy.before;
    } else if (proxy.after) {
      var after = (proxy.after.call ? proxy.after.call(parent, child, proxy) : proxy.after);
      if (after) result.before = after.nextSibling;
    }
    return result;
  },
  
  perform: function(widget, child, bypass) {
    var element = widget.element || widget.toElement();
    for (var node = widget, proxies; node; node = node.parentNode)
      if ((proxies = node.proxies)) 
        for (var j = 0, proxy; proxy = proxies[j++];)
          if (((node == widget) || proxy.deep) && (!proxy.type || proxy.type != bypass)) {
            if (LSD.Module.Proxies.match(child, proxy, proxy.selector ? widget : proxy.element)) {
              return LSD.Module.Proxies.invoke(child.lsd ? widget : element, child, proxy);
            }
          }
  },
  
  realize: function(node, origin, proxy) {
    proxy.container = node;
    if (proxy.queued) {
      if (node.lsd) var element = node.element || node.toElement(), widget = node;
      else var element = node, widget = origin;
      for (var i = 0, child; child = proxy.queued[i++];) {
        origin.document.layout.appendChild([widget, element], child, false, child.lsd ? element : null, element);
      }
    }
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