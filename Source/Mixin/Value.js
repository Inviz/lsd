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
  
  setValue: function(item, unset) {
    if (item == null || (item.event && item.type)) item = this.getRawValue();
    var value = this.processValue(item), result = false;
    if (this.isValueDifferent(value) ^ (!!unset)) {
      result = this.writeValue(value, unset);
      this.onChange(value, this.getPreviousValue());
    }
    return result
  },
  
  isValueDifferent: function(value) {
    if (this.attributes.multiple) {
      return this.values.indexOf(value) == -1
    } else {
      return this.value != value;
    }
  },
  
  getValueInput: function() {
    var tag = LSD.toLowerCase(this.element.tagName)
    if (!this.attributes.multiple && this.attributes.type != 'file' 
      && (tag == 'input' || tag == 'textarea')) return this.element;

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
    } else {
      var input = this.valueInput || (this.valueInput = this.getValueInput());
      this.previousValue = this.value;
      if (unset) delete this.value;
      else this.value = value;
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

  formatValue: function(value) {
    return value;
  },
  
  processValue: function(value) {
    return value;
  },
  
  onChange: function() {
    if (this.isValueChangable()) this.fireEvent('change', arguments)
    return true;
  },
  
  isValueChangable: function() {
    return this.getCommandType ? (this.getCommandType == 'command') : true;
  }
});

LSD.Behavior.define(':read-write, :valued', LSD.Mixin.Value);