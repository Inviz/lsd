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
    states: {
      working: {
        enabler: 'busy',
        disabler: 'idle'
      }
    },
    events: {
      self: {
        submit: 'send',
        
        build: function() {
          if (this.attributes.autosend) this.send();
        },
        
        getCommandAction: function() {
          if (!this.isRequestURLLocal()) return 'send';
        },

        getTargetAction: function() {
          if (this.getCommandAction() == 'send') return 'update';
        }
      }
    }
  },
  
  send: function() {
    var data = this.getRequestData && this.getRequestData() || null;
    var options = Object.merge({}, this.options.request, {data: data, url: this.getRequestURL(), method: this.getRequestMethod()});
    for (var i = 0, j = arguments.length, arg, opts; i < j; i++) {
      var arg = arguments[i];
      if (!arg) continue;
      if (typeof arg == 'object' && !arg.event) {
        if (("url" in arg) || ("method" in arg) || ("data" in arg)) Object.merge(options, arg)
        else options.data = Object.merge(options.data || {}, arg);
      } else if (arg.call) var callback = arg;
    }
    var request = this.getRequest(options);
    if (callback) request.addEvent('complete:once', callback);
    return request.send(options);
  },
  
  getRequest: function(options) {
    var type = this.getRequestType();
    if (!this.request || this.request.type != type) {
      if (!this.request) this.addEvent('request', {
        request: 'onRequest',
        complete: 'onRequestComplete',
        success: 'onRequestSuccess',
        failure: 'onRequestFailure'
      });
      this.request = this[type == 'xhr' ? 'getXHRRequest' : 'getFormRequest'](options);
      if (!this.request.type) {
        this.request.type = type;
        this.fireEvent('register', ['request', this.request, type]);
      }
    }
    return this.request;
  },
  
  onRequestSuccess: function() {
    if (this.chainPhase == -1 && this.getCommandAction() == 'send') this.callOptionalChain.apply(this, arguments);
  },
  
  onRequest: function() {
    this.busy();
  },
  
  onRequestComplete: function() {
    this.idle();
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

LSD.Behavior.define('[action], [src], [href]', LSD.Mixin.Request);