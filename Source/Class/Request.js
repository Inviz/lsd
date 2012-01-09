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
  
  type: function() {
    
  },
  data: function() {
    
  },
  method: function() {
    
  },
  url: function() {
    
  },
  
  exports: {
    send: function() {
      
    },
    stop: function() {
      
    },
    started: 'started'
  },
  
  events: {
    start: function() {
      this.set('started', true);
    },
    complete: function() {
      this.unset('started', false);
    }
  }
  
});

LSD.Type.Request

LSD.Behavior.define(':form[action], [src], [href], :request', 'request');
