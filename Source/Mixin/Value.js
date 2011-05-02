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
          if (!('value' in this)) this.value = this.processValue(this.options.value || this.getRawValue());
        },
        change: 'callChain'
      }
    }
  },
  
  setValue: function(item) {
    if (item == null || (item.event && item.type)) item = this.getRawValue();
    this.oldValue = this.value;
    this.value = this.processValue(item);
    if (this.oldValue !== this.value) {
      var result = this.applyValue(this.value);
      this.onChange(this.value, this.oldValue);
      return result;
    }
  },
  
  applyValue: Macro.defaults(function(item) {
    if (this.attributes.itemprop) this.element.set('itemvalue', item);
  }),
  
  getRawValue: Macro.defaults(function() {
    return this.attributes.value || LSD.Module.DOM.getID(this) || this.innerText;
  }),

  getValue: function() {
    return this.formatValue(('value' in this) ? this.value : this.getRawValue());
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