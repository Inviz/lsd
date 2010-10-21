/*
---
 
script: Proxies.js
 
description: Dont adopt children, pass them to some other widget
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Trait.Aware

provides: [ART.Widget.Trait.Proxies]
 
...
*/

ART.Widget.Trait.Proxies = new Class({
  
  options: {
    proxies: {}
  },
  
  events: {
    proxies: {
      self: {
        hello: 'populateProxyTarget'
      }
    }
  },
  
  getProxies: Macro.setter('proxies', function() {
    var options = this.options.proxies;
    var proxies = []
    for (var name in options) proxies.push(options[name]);
    return proxies.sort(function(a, b) {
      return (a.priority || 0) > (b.priority || 0) ? -1 : 1
    })
  }),
  
  populateProxyTarget: function(widget) {
    for (var i = 0, proxies = this.getProxies(), proxy; proxy = proxies[i++];) {
      if (!proxy.queue) return;
      var container = proxy.container.call(this);
      if (widget ? (widget == container) : container) { 
        for (var queue = proxy.queue, child; child = queue.shift();) this.proxyChild(child, proxy);
      }
      delete proxy.queue;
    }
  },
  
  proxyChild: function(child, proxy) {
    if (proxy.indexOf) proxy = this.options.proxies[proxy];
    if (!proxy.condition.call(this, child)) return false;
    var container = proxy.container.call(this);
    if (!container) {
      if (!proxy.queue) proxy.queue = [];
      proxy.queue.push(child);
      var events = this.events.proxies;
      if (!events.attached) {
        this.addEvents(events);
        events.attached = true;
      }
    } else {
      if (proxy.rewrite === false) {
        this.appendChild(child, function() {
          container.adopt(child);
        });
        //child.fireEvent('inject', this);
      } else {
        child.inject(container);
      } 
      
      var events = this.events.proxies;
      if (events.attached) {
        delete events.attached;
        this.removeEvents(events);
      }
    }
    return true;
  },
  
  canAppendChild: function(child) {
    for (var i = 0, proxies = this.getProxies(), proxy; proxy = proxies[i++];) if (this.proxyChild(child, proxy)) return false;
    return true;
  },
  
  render: function() {
    //this.populateProxyTarget(); //do it before everything else
    return this.parent.apply(this, arguments);  
  }
  
});

Widget.Events.Ignore.push('proxy')