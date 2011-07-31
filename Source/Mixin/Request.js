/*
---
 
script: Request.js
 
description: Make various requests to back end
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Mixin
  - Core/Request
  - Ext/Request.Form
  - Ext/Request.Auto
  - Ext/document.createFragment
  
provides: 
  - LSD.Mixin.Request
 
...
*/

LSD.Mixin.Request = new Class({
  options: {
    request: {
      method: 'get'
    },
    states: Array.object('working'),
    events: {
      self: {
        submit: function() {
          return this.send.apply(this, arguments);
        },
        
        cancel: function() {
          return this.stop()
        },
        
        getCommandAction: function() {
          if (!this.isRequestURLLocal()) return 'submit';
        },

        getTargetAction: function() {
          if (this.getCommandAction() == 'submit') return 'update';
        }
      },
      request: {
        request: 'busy',
        complete: 'idle'
      }
    }
  },
  
  send: function() {
    var data = this.getRequestData && this.getRequestData() || null;
    var options = Object.merge({}, this.options.request, {data: data, url: this.getRequestURL(), method: this.getRequestMethod()});
    for (var i = 0, j = arguments.length, arg, opts; i < j; i++) {
      var arg = arguments[i];
      if (!arg) continue;
      if (typeof arg == 'object' && !arg.event && !arg.indexOf) {
        if (("url" in arg) || ("method" in arg) || ("data" in arg)) Object.merge(options, arg)
        else options.data = Object.merge(options.data || {}, arg);
      } else if (arg.call) var callback = arg;
    }
    var request = this.getRequest(options);
    request.addEvent('complete:once', function() {
      if (callback) callback();
      if (request.isSuccess && request.isSuccess() && this.getCommandAction && this.getCommandAction() == 'submit')
        if (this.chainPhase == -1 || (this.chainPhase == this.getActionChain().length - 1))  
          this.eachLink('optional', arguments, true);
    }.bind(this));
    this.fireEvent('send', options);
    return request.send(options);
  },
  
  stop: function() {
    if (this.request) this.request.cancel();
    this.fireEvent('stop');
    return this;
  },
  
  getRequest: function(options, fresh) {
    var type = (options && options.type) || this.getRequestType();
    if (fresh || !this.request || this.request.type != type) {
      this.request = this[type == 'xhr' ? 'getXHRRequest' : 'getFormRequest'](options);
      if (!this.request.type) {
        this.request.type = type;
        this.fireEvent('register', ['request', this.request, type]);
      }
    }
    return this.request;
  },
  
  getXHRRequest: function(options) {
    return new Request.Auto(options);
  },
  
  getFormRequest: function(options) {
    return new Request.Form(options);
  },
  
  getRequestType: function() {
    return this.attributes.transport || this.options.request.type;
  },
  
  getRequestMethod: function() {
    return this.attributes.method || this.options.request.method;
  },
  
  getRequestURL: function() {
    return this.attributes.href || this.attributes.src || this.attributes.action;
  },
  
  isRequestURLLocal: function(base, host) {
    if (!host) host = location.host;
    if (!base) base = location.pathname;
    var url = this.getRequestURL();
    return !url || (url.charAt(0) == "#") || url.match(new RegExp('(?:' + host + ')?' + base + '/?#'));
  }
});

LSD.Behavior.define(':form[action], [src], [href]', LSD.Mixin.Request);