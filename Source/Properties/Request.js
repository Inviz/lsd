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

LSD.Request = LSD.Properties.Request = new LSD.Struct({
  format: function() {
    
  },
  
  started: function(value, old, memo) {
    
  },
  
  imports: {
    data: '.elements'
  }
});
LSD.Request.prototype.encoding = 'utf-8';
LSD.Request.prototype.onStateChange = function() {
};
LSD.Request.prototype.onCancel = function() {
};
LSD.Request.prototype.onComplete = function() {
};
LSD.Request.prototype.onSuccess = function() {
};
LSD.Request.prototype.onFailure = function() {
};
LSD.Request.prototype.isSuccess = function() {
  return this.status > 199 && this.status < 300;
};