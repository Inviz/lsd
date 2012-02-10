/*
---
 
script: Allocations.js
 
description: A reusable temporary link to widgets built on demand
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Properties
  - LSD.Struct.Stack
  - LSD.Document

provides: 
  - LSD.Properties.Allocations
 
...
*/

LSD.Properties.Allocations = LSD.Struct({

});
LSD.Properties.Allocations.prototype.onChange = function(key, value, state, old, memo) {
  var ns = this._parent.document || LSD.Document.prototype;
  var options = ns.allocations[key];
  if (options) value.mix(options, null, state);
  return value;
}
LSD.Properties.Allocations.prototype._eager = true;
LSD.Properties.Allocations.prototype._getConstructor = function(key) {
  var ns = this._parent.document || LSD.Document.prototype;
  if (ns.allocations[key]) return this._parent.__constructor || this._parent.constructor;
}
LSD.Properties.Allocations.Properties = {
  proxy: function() {
    
  },
  
  options: function() {
    
  }
};