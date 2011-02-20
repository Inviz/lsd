/*
---
 
script: Request.js
 
description: Make various requests to back end
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD
  - Core/Request
  - Ext/Request.Form
  - Ext/Request.Auto
  - Core
  
provides: 
  - LSD.Mixin.Request
 
...
*/

LSD.Mixin.Request = new Class({
  behaviour: '[action], [src], [href]',
  
  Stateful: {
    working: ['busy', 'idle']
  },
  
  options: {
    request: {
      method: 'get',
      type: 'xhr'
    }
  },
  
  send: function() {
    var request = this.getRequest();
    return request.send.apply(request, arguments);
  },
  
  getRequest: function(opts) {
    console.log(this.getRequestData())
    var options = Object.append({data: this.getRequestData(), url: this.getRequestURL()}, this.options.request, {type: this.getRequestType(), method: this.getRequestMethod()}, opts);
    if (!this.request || this.request.type != options.type) {
      this.request = this[options.type == 'xhr' ? 'getXHRRequest' : 'getFormRequest'](options)
      if (!this.request.type) {
        this.request.type = options.type;
        if (!this.events._request) this.events._request = this.bindEvents({
          request: 'busy',
          complete: 'idle',
          success: 'onRequestSuccess',
          failure: 'onRequestFailure'
        });
        if (this.events.request) this.request.addEvents(this.events.request);
        this.request.addEvents(this.events._request)
      }
    }
    return this.request;
  },
  
  getRequestData: Macro.defaults(function() {
    return null;
  }),
  
  getXHRRequest: function(options) {
    return new Request.Auto(options)
  },
  
  getFormRequest: function(options) {
    return new Request.Form(options)
  },
  
  getRequestType: function() {
    return this.getAttribute('transport') || this.options.request.type;
  },
  
  getRequestMethod: function() {
    return this.getAttribute('method') || this.options.request.method;
  },
  
  getRequestURL: function() {
    return this.attributes.action || this.attributes.href || this.attributes.src;
  }
})