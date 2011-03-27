/*
---
 
script: Fieldset.js
 
description: Wrapper around set of form fields
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD
 
provides: 
  - LSD.Trait.Fieldset
 
...
*/

LSD.Trait.Fieldset = new Class({
  options: {
    events :{
      request: {
        request: 'validateFields',
        badRequest: 'addFieldErrors'
      }
    }
  },
  
  initialize: function() {
    this.elements = [];
    this.names = {};
    this.params = {};
    this.addEvent('nodeInserted', function(node) {
      if (node.pseudos['read-write']) this.addField(node)
    });
    this.parent.apply(this, arguments)
  },
  
  checkValidity: function() {
    var valid = true;
    for (var i = 0, element; element = this.elements[i++];) if (!element.checkValidity()) valid = false;
    return valid;
  },
  
  getData: function() {
    var data = {}
    for (var name in this.names) data[name] = this.names[name].getValue();
    return data;
  },

  getRequestData: function() {
    return this.element;
  },
  
  reset: function() {
    
  },
  
  addFieldErrors: function(response) {
    var regex = LSD.Trait.Fieldset.rPrefixAppender;
    for (var model in response) {
      var value = response[model], errors = value.errors;
      if (!errors) continue;
      if (errors.each) {
        errors.each(function(error) {
          var name = model + error[0].replace(regex, function(match) {return '[' + match + ']'});
          var field = this.names[name];
          if (field) {
            field.invalidate(error[1]);
            this.invalid = true;
          }
        }, this)
      }
    }
  },
  
  addField: function(widget, object) {
    this.elements.push(widget);
    var name = widget.attributes.name;
    if (!name) return;
    if (!object) {
      this.names[name] = widget;
      object = this.params;
    }
    for (var regex = LSD.Trait.Fieldset.rNameParser, match, bit;;) {
      match = regex.exec(name)
      if (bit != null) {
        if (!match) {
          if (object[bit] && object[bit].push) object[bit].push(widget);
          else object[bit] = widget;
        } else object = object[bit] || (object[bit] = (bit ? {} : []));
      }
      if (!match) break;
      else bit = match[1] ||match[2];
    }
    return object
  },

  invalidateFields: function(errors) {
    this.getFields(errors, function(field, error) {
      field.invalidate(error);
    });
  },
  
  getFieldsByName: function(fields, callback, root) {
    if (fields.call && (callback = fields)) fields = null;
    if (!fields) fields = this.elements;
    if (!callback && fields.indexOf) return root[fields]
    if (fields.map && fields.each && (!callback || !root)) return fields.map(function(field) {
      return this.getFieldsByName(field, callback, root)
    }.bind(this));
  },
  
  validateFields: function(fields) {
    if (!this.invalid) return;
    this.getElements(':read-write:invalid').each(function(field) {
      field.validate(true);
    })
  }
});

LSD.Trait.Fieldset.rNameParser = /(^[^\[]+)|\[([^\]]*)\]/ig
LSD.Trait.Fieldset.rPrefixAppender = /^[^\[]+/i