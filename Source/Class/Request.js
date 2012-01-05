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

LSD.Type.Request = new LSD.Class({
  Extends: Request.Auto,
  
  options: {
    request: {
      method: 'get'
    }
  },
  
  properties: {
    type: function() {
      
    },
    data: function() {
      
    },
    method: function() {
      
    },
    url: function() {
      
    }
  },
  
  exports: {
    send: function() {
      
    },
    stop: function() {
      
    },
    started: '.started'
  },
  
  events: {
    start: function() {
      this.include('started');
    },
    complete: function() {
      this.erase('started');
    }
  }
  
});

LSD.Behavior.define(':form[action], [src], [href], :request', 'request');
