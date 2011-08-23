/*
---
 
script: Validity.js
 
description: Validates widgets against preset rules
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
references:
  - http://www.w3.org/TR/html5/association-of-controls-and-forms.html#constraints
 
requires:
  - LSD.Mixin
 
provides: 
  - LSD.Mixin.Validity
...
*/

/* 
  There is a slight difference between this and a w3c spec.
  Spec states that as a result of a validation, there should
  be a .validity object on widget that holds all possible
  validation errors as keys and true or false as values. 
  
  Our .validity object doesnt not contain validations that
  passed successfuly and only holds errors. This gets it
  closer to ActiveRecord's validation system.
*/
   

!function() {

LSD.Mixin.Validity = new Class({
  constructors: {
    validity: function(options, state) {
      this.states[state ? 'include' : 'erase'](this.attributes.required ? 'required' : 'optional');
      this[state ? 'addEvents' : 'removeEvents'](LSD.Mixin.Validity.events);
    }
  },
  
  checkValidity: function() {
    var validity = this.validity = {};
    var value = this.getValue();
    for (var attribute in Attributes) {
      var constraint = this.attributes[attribute]
      if (!constraint) continue;
      var result = Attributes[attribute].call(this, value, constraint)
      if (!result) continue;
      validity[result] = true;
    }
    for (var i in validity) return !this.invalidate();
    return this.validate(true);
  },
  
  validate: function(value) {
    if (value !== true && !this.checkValidity()) return false;
    if (this.invalid) this.setStateTo('invalid', false, arguments);
    if (!this.valid) this.setStateTo('valid', true, arguments);
    return true;
  },
  
  invalidate: function(value) {
    if (this.valid) this.setStateTo('valid', false, arguments);
    if (!this.invalid) this.setStateTo('invalid', true, arguments);
    return true;
  },
  
  unvalidate: function() {
    if (this.valid) this.setStateTo('valid', false);
    if (this.invalid) this.setStateTo('invalid', false);
  },
  
  setCustomValidity: function(validity) {
    this.validationMessage = validity;
    this.validity.customError = true;
  }
});

LSD.Mixin.Validity.events = {
  invalidate: function(message) {
    this.allocate('message', 'error', LSD.Mixin.Validity.message, message)
  },
  
  unvalidate: function() {
    this.release('message');
  }
};

LSD.Mixin.Validity.message = {
  position: ['top', 'left'],
  parent: function() {
    return document.body
  }
};

var Attributes = LSD.Mixin.Validity.Attributes = {
  required: function(value) {
    if (!value) return "valueMissing"
  },
  type: function(value, type) {
    if (!value.match()) return "typeMismatch"
  },
  pattern: function(value, pattern) {
    if (!value.match(pattern)) return "patternMismatch"
  },
  maxlength: function(value, length) {
    if ((value !== null) && (value.toString().length > length)) return "tooLong"
  },
  min: function(value, min) {
    if (value < min) return "rangeUnderflow"
  },
  max: function(value, max) {
    if (value > max) return "rangeOverflow"
  },
  step: function(value, step) {
    if (value % step > 0) return "stepMismatch"
  }
}

LSD.Behavior.define('[name], :value', 'validity');

}();