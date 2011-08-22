/*
---
 
script: Value.js
 
description: Add your widget have a real form value.
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Mixin
 
provides: 
  - LSD.Mixin.Value
 
...
*/

LSD.Mixin.Value = new Class({
  options: {
    actions: {
      value: {
        enable: function() {
          if (!this.attributes.multiple) {
            if (typeof this.value != 'undefined') return;
            this.setValue();
          }
        },
        disable: function() {
          
        }
      }
    }
  },
  
  constructors: {
    value: function() {
      if (this.attributes.multiple) this.values = [];
    }
  },
  
  setValue: function(value, unset) {
    if (value == null || (value.event && value.type)) value = this.getDefaultValue();
    
    else if (value.getValue) value = this.processValue(value.getValue());
    var result = false;
    if (this.isValueDifferent(value) ^ unset) {
      result = this.writeValue(value, unset);
      var previous = this.getPreviousValue();
      this.fireEvent('change', [value, previous]);
      if (!this.click && previous != null) this.callChain(value, previous);
    }
    return result
  },
  
  unsetValue: function(item) {
    return this.setValue(item, true)
  },

  getValue: function() {
    if (this.attributes.multiple) {
      if (this.values) this.values = []; 
      return this.values.map(this.formatValue, this);
    } else {
      if (typeof this.value == 'undefined') this.value = this.getDefaultValue();
      return this.formatValue(this.value);
    }
  },
  
  writeValue: function(value, unset) {
    if (this.attributes.multiple) {
      if (unset) {
        var index = this.values.indexOf(value);
        if (index > -1) {
          this.values.splice(index, 1);
          this.valueInputs.splice(index, 1)[0].dispose();
        }
      } else {  
        this.previousValue = this.values.clone();
        this.values.push(value);
        (this.valueInputs || (this.valueInputs = [])).push(this.getValueInput().set('value', value));
        this.applyValue(this.values);
      }
      if (this.values.length == +!unset) this[unset ? 'removePseudo' : 'addPseudo']('valued');
    } else {
      var input = this.valueInput || (this.valueInput = this.getValueInput());
      this.previousValue = this.value;
      if (unset) {
        if (this.value) this.removePseudo('valued');
        delete this.value;
      } else {
        if (!this.value) this.addPseudo('valued');
        this.value = value;
      }
      input.set('value', unset ? '' : value);
      this.applyValue(this.value);
    }
  },
  
  applyValue: function(value) {
    return this;
  },

  formatValue: function(value) {
    return value;
  },
  
  processValue: function(value) {
    return value;
  },
  
  getDefaultValue: function() {
    var value = this.getRawValue();
    if (value != null) return this.processValue(value);
  },
  
  getRawValue: function() {
    return this.attributes.value || LSD.Module.DOM.getID(this) || (this.element && this.element.get('text'));
  },
  
  getPreviousValue: function() {
    return this.previousValue
  },
  
  shouldCallChainOnValueChange: function() {
    var type = this.getCommandType ? this.getCommandType() : this.commandType; 
    return !type || type == 'command';
  },
  
  isValueDifferent: function(value) {
    if (this.attributes.multiple) {
      return this.values.indexOf(value) == -1
    } else {
      return this.value != value;
    }
  },
  
  toData: function() {
    switch (this.commandType || (this.getCommandType && this.getCommandType())) {
      case "checkbox": case "radio":
        if (!this.checked) return;
    }
    return this.getValue();
  },
  
  getData: function() {
    var data = {};
    if (this.attributes.name) data[this.attributes.name] = this.toData();
    return data;
  },
  
  canElementHoldValue: function() {
    var tag = LSD.toLowerCase(this.element.tagName)
    return (!this.attributes.multiple && this.attributes.type != 'file' 
      && (tag == 'input' || tag == 'textarea')) 
  },
  
  getValueInput: function() {
    if (this.canElementHoldValue()) return this.element;
    var name = this.attributes.name;
    if (this.attributes.miltiple) name += '[]';
    return new Element('input[type=hidden]', {name: name}).inject(this.element);
  }
});

LSD.Behavior.define(':value', 'value');