/*
---
 
script: Value.js
 
description: Add your widget have a real form value.
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Trait
 
provides: 
  - LSD.Mixin.Value
 
...
*/

LSD.Mixin.Value = new Class({
  behaviour: ':read-write, :valued',
  
  options: {
    events: {
      _value: {
        dominject: function() {
        },
        change: 'callChain'
      }
    },
    multiple: false,
    actions: {
      value: {
        enable: function() {
          if (this.attributes.multiple) this.values = []
          if (this.getValue() != null) return;
          var raw = this.getRawValue();
          if (raw != null) this.setValue(raw);
        },
        disable: function() {
          
        }
      }
    }
  },
  
  setValue: function(item) {
    if (item == null || (item.event && item.type)) item = this.getRawValue();
    var value = this.processValue(item), result = false;
    if (this.isValueDifferent(value)) {
      result = this.writeValue(value);
      this.onChange(value, this.oldValue);
    }
    return result
  },
  
  unsetValue: function(item) {
    if (item == null || (item.event && item.type)) item = this.getRawValue();
    var value = this.processValue(''), result = false;
    if (!this.isValueDifferent(value)) {
      result = this.applyValue(value);
      this.onChange(value, this.oldValue);
    }
  },
  
  isValueDifferent: function(value) {
    if (this.attributes.multiple) {
      return this.values.indexOf == -1
    } else {
      return this.value != value;
    }
  },
  
  writeValue: function(value, unset) {
    if (this.attributes.multiple) {
      if (unset) {
        var index = this.values.indexOf(value);
        if (index > -1) this.values.splice(index, 1);
      } else this.values.push(value);
      this.applyValue(this.values);
    } else {
      this.value = value;
      this.applyValue(this.value);
    }
  },
  
  getRawValue: function() {
    return this.attributes.value || LSD.Module.DOM.getID(this) || this.innerText;
  },

  getValue: function() {
    if (this.attributes.multiple) {
      return this.values.map(this.formatValue, this)
    } else {
      return this.formatValue(this.value);
    }
  },

  formatValue: function(value) {
    return value;
  },
  
  processValue: function(value) {
    return value;
  },
  
  onChange: function() {
    this.fireEvent('change', arguments)
    return true;
  }
});