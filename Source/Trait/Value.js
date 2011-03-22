/*
---
 
script: Value.js
 
description: Make your widget have a real form value.
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD
 
provides: 
  - LSD.Trait.Value
 
...
*/

LSD.Trait.Value = new Class({
  options: {
    events: {
      _value: {
        build: function() {
          if (!('value' in this)) this.value = this.processValue(this.getRawValue());
        }
      }
    }
  },
  
  setValue: function(item) {
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
    //return this.setContent(item)
  },
  
  getRawValue: function() {
    if (this.attributes && this.attributes.value) return this.attributes.value;
  },

  getValue: function() {
    return this.formatValue(this.value);
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