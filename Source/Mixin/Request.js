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
      }
    }
  },

  send: function() {
    var options = {url: this.getRequestURL(), method: this.getRequestMethod()};
    if (this.getRequestData) options.data = LSD.toObject(this.getRequestData());
    options = Object.merge({}, this.options.request, options);
    for (var i = 0, j = arguments.length, arg, opts; i < j; i++) {
      var arg = arguments[i];
      if (!arg) continue;
      if (typeof arg == 'object' && !arg.event && !arg.indexOf) {
        if (("url" in arg) || ("method" in arg) || ("data" in arg)) Object.merge(options, arg)
        else options.data = Object.merge(options.data || {}, arg);
      } else if (arg.call) var callback = arg;
    }
    if (options.data) options.data = LSD.Object.toObject(options.data);
    if (!this.request) this.properties.set('request', this.getRequest(options));
    if (callback) this.request.addEvent('complete:once', callback);
    this.fireEvent('send', options);
    return this.request.send(options);
  },

  stop: function() {
    if (this.request) {
      this.request.cancel();
      this.properties.unset('request', this.request);
    }
    this.fireEvent('stop');
    return this;
  },

  getRequest: function(options) {
    var type = (options && options.type) || this.getRequestType();
    var request = this[type == 'xhr' ? 'getXHRRequest' : 'getFormRequest'](options);
    request.addEvents({
      request: function() {
        this.busy()
      }.bind(this),
      complete: function() {
        this.idle();
        if (request.isSuccess && request.isSuccess() && this.getCommandAction && this.getCommandAction() == 'submit')
          if (this.chainPhase == -1
          || (this.chainPhase == this.getActionChain().length - 1)
          || ((this.currentChain[this.chainPhase].action == 'submit') && this.currentChain[this.chainPhase] == null))
            this.eachLink('optional', arguments, true);
      }.bind(this)
    });
    return request;
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

LSD.Behavior.define(':form[action], [src], [href], :request', 'request');
