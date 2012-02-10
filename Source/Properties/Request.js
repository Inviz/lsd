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

LSD.Properties.Request = new LSD.Class({
  Extends: Request.Auto,
  
  options: {
    request: {
      method: 'get'
    }
  },
  
  type: function() {
    
  },
  
  imports: {
    data: '.fields'
  },
  
  exports: {
    send: function() {
      
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

LSD.Properties.Request

LSD.Behavior.define(':form[action], [src], [href], :request', 'request');
