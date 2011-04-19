/*
---
 
script: Value.js
 
description: Add your widget have a real form value.
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Trait
 
provides: 
  - LSD.Trait.Value
 
...
*/

LSD.Trait.Value = new Class({
  behaviour: '[value]',
  
  options: {
    events: {
      _value: {
        dominject: function() {
          if (!('value' in this)) this.value = this.processValue(this.options.value || this.getRawValue());
        }
      }
    }
  },
  
  setValue: function(item) {
    if (item == null || (item.event && item.type)) item = this.getRawValue();
    var value = this.value;
    this.value = this.processValue(item);
    if (value !== this.value) {
      var result = this.applyValue(this.value);
      this.onChange(this.value);
      return result;
    }
  },
  
  applyValue: function(item) {
    if (this.element.getProperty('itemprop')) this.element.set('itemvalue', item);
  },
  
  getRawValue: function() {
    return this.attributes.value || this.attributes.itemid || (this.element && this.element.get('text').trim())
  },

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