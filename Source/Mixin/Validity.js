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
  initialize: function() {
    this.parent.apply(this, arguments);
    this.addClass(this.attributes.required ? 'required' : 'optional');
  },
  
  checkValidity: function() {
    var validity = this.validity = {};
    var value = this.getValue();
    for (attribute in Attributes) {
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
    this.setStateTo('valid', true);
    this.setStateTo('invalid', false);
    return true;
  },
  
  invalidate: function(value) {
    this.setStateTo('invalid', true);
    this.setStateTo('valid', false);
    return true;
  },
  
  setCustomValidity: function(validity) {
    this.validationMessage = validity;
    this.validity.customError = true;
  }
});

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

LSD.Behavior.define('[name], :value', LSD.Mixin.Validity);

}();