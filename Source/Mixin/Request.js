/*
---
 
script: Request.js
 
description: Make various requests to back end
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD
  - Core/Request
  - Ext/Request.Form
  
provides: 
  - LSD.Mixin.Request
 
...
*/

LSD.Mixin.Request = new Class({
  behaviour: '[action]',
  
  options: {
    events: {
      request: {
        success: 'onRequestSuccess',
        failure: 'onRequestFailure'
      }
    },
    request: {
      method: 'get',
      type: 'xhr'
    }
  },
  
  send: function() {
    return this.getRequest().send.apply(this.getRequest(), arguments);
  },
  
  onRequestSuccess: function(response) {
    
  },
  
  onResponseFailure: function(response) {
    
  },
  
  getRequest: function(opts) {
    var options = Object.append({}, this.options.request, {type: this.getRequestType(), method: this.getRequestMethod()}, opts);
    if (!this.request || this.request.type != options.type) {
      this.request = this[options.type == 'xhr' ? 'getXHRRequest' : 'getFormRequest'](options)
      this.request.addEvents(this.events.request);
    }
    return this.request;
  },
  
  getXHRRequest: function(options) {
    return new Request(options)
  },
  
  getFormRequest: function(options) {
    return new Request.Form(options)
  },
  
  getRequestType: function() {
    return this.getAttribute('transport') || this.options.request.type;
  },
  
  getRequestMethod: function() {
    return this.getAttribute('method') || this.options.request.method;
  }
})