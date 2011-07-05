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
          if (this.attributes.multiple) this.values = [];
          if (this.getValue() != null) return;
          var raw = this.getRawValue();
          if (raw != null) this.setValue(raw);
        },
        disable: function() {
          
        }
      }
    }
  },
  
  setValue: function(item, unset) {
    if (item == null || (item.event && item.type)) item = this.getRawValue();
    else if (item.getValue) item = item.getValue();
    var value = this.processValue(item), result = false;
    if (this.isValueDifferent(value) ^ unset) {
      result = this.writeValue(value, unset);
      var previous = this.getPreviousValue();
      this.fireEvent('change', [value, previous]);
      if (!this.click) this.callChain(value, previous);
    }
    return result
  },
  
  unsetValue: function(item) {
    return this.setValue(item, true)
  },
  
  isValueDifferent: function(value) {
    if (this.attributes.multiple) {
      return this.values.indexOf(value) == -1
    } else {
      return this.value != value;
    }
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
  
  getPreviousValue: function() {
    return this.previousValue
  },
  
  applyValue: function(value) {
    return this;
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
  
  shouldCallChainOnValueChange: function() {
    var type = this.getCommandType ? this.getCommandType() : this.commandType; 
    return !type || type == 'command';
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

  formatValue: function(value) {
    return value;
  },
  
  processValue: function(value) {
    return value;
  }
});

LSD.Behavior.define(':value', LSD.Mixin.Value);