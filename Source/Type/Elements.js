/*
---
 
script: Children.js
 
description: Makes a DOM tree like structure out of any objects
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Type
  - LSD.Script/LSD.Struct
  - LSD.Script/LSD.Array
  - LSD.Script/*
  - Core/Element

provides: 
  - LSD.Mixin.Draggable
 
...
*/

LSD.Type.Elements = LSD.Struct.Array({
  exports: {
    length: 'length'
  }
});
LSD.Type.Elements.prototype.onSet = function(value, index, state, old, memo) {
  if (old == null) {
    if (state === false) value.attributes.unwatch('name', this);
    else value.attributes.watch('name', (this._identifier || (this._identifier = {
      fn: this._identify,
      callback: this
    }))
  }
};
LSD.Type.Elements.prototype._identify = function(call, key, value, old) {
  var object = call.callback;
  if (value) value.watch('formValue', (object._observer || object._observer = {
    fn: object._observe,
    callback: object
  }))
  if (old) old.unwatch('formValue', object);
};
LSD.Type.Elements.prototype._observe = function(call, key, value, old) {
  call.callback.values.reset(this.attributes.name, value);
};
LSD.Type.Elements.prototype._get = LSD.Object.Params.prototype.get;
LSD.Type.Elements.prototype._set = LSD.Object.Params.prototype.set;
LSD.Type.Elements.prototype._unset = LSD.Object.Params.prototype.unset;