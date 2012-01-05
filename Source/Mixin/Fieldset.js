/*
---
 
script: Fieldset.js
 
description: Wrapper around set of form fields
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Mixin
 
provides: 
  - LSD.Mixin.Fieldset
 
...
*/
!function() {
  
LSD.Mixin.Fieldset = new Class({
  options: {
    has: {
      many: {
        elements: {
          selector: ':form-associated',
          scopes: {
            submittable: {
              filter: '[name]'
            },
            invalid: {
              filter: ':invalid'
            }
          },
          callbacks: {
            add: 'addField',
            remove: 'removeField'
          }
        }
      }
    },
    expects: {
      ':form': function(widget, state) {
        widget[state ? 'addRelation' : 'removeRelation']('elements', {as: 'form'});
      }
    }
  },
  
  constructors: {
    fieldset: function(options, state) {
      if (state) {
        this.values = new LSD.Object.Params;
        this.fields = new LSD.Object.Params;
      }
      this.variables[state ? 'merge' : 'unmerge']({values: this.values, fields: this.fields});
      if (!state) {
        delete this.values;
        delete this.field;
      }
      this[state ? 'addEvents' : 'removeEvents'](LSD.Mixin.Fieldset.events);
    }
  },
  
  checkValidity: function() {
    return this.elements.every(function(element) { 
      return element.checkValidity();
    });
  },
  
  getData: function() {
    this.submittedFields = new LSD.Object.Params(this.fields.toObject(true, true));
    return this.submittedFields;
  },

  getRequestData: function() {
    return this.getData.apply(this, arguments);
  },
  
  reset: function() {
    
  },
  
  addFieldErrors: function(errors) {
    for (var name in errors) {
      var field = this.submittedFields && this.submittedFields.get(name) || this.fields.get(name);
      if (!field) continue;
      if (!field.lsd) {
        for (var i in field)
          if (field[i] != null && field[i].lsd) {
            field = field[i];
            break;
          } 
        if (field == null || !field.lsd) continue;
      }
      field.invalidate(errors[name]);
    }
    this.errors = errors;
    this.addEvent('beforeSubmit:once', this.removeFieldErrors);
  },
  
  removeFieldErrors: function() {
    var errors = this.errors;
    for (var name in errors) {
      var field = this.submittedFields && this.submittedFields.get(name) || this.fields.get(name);
      if (!field) continue;
      if (!field.lsd) {
        for (var i in field)
          if (field[i] != null && field[i].lsd) {
            field = field[i];
            break;
          } 
        if (field == null || !field.lsd) continue;
      }
      if (field.invalid) field.setStateTo('invalid', false);
    }
    delete this.errors
  },

  parseFieldErrors: function(response, result, root) {
    var errors = response.errors;
    if (typeof response == "object") {
      if (typeof result != 'object') result = {};
      if (errors) {
        if (errors.push) {
          for (var i = 0, error; error = errors[i++];)
            result[Fieldset.getName(root || this.getModelName(error[0]), error[0])] = error[1];
        } else {
          for (var name in errors)
            result[Fieldset.getName(root || this.getModelName(name), name)] = errors[name];
        }
      }
      Object.each(response, function(value, key) {
        if (!root) root = this.getModelName(key);
        if (typeof value == "object" && value != null && key != 'errors') {
          this.parseFieldErrors(value, result, key);
        }
      }, this)
    }
    if (result != null && Object.getLength(result) > 0) this.addFieldErrors(result);
  },
  
  addField: function(widget) {
    var name = widget.attributes.name;
    if (!name || !widget.toData) return;
    var callback = function(value, old) {
      if (typeof value == 'undefined') {
        if (typeof old != 'undefined') this.values.unset(name, widget.getValue());
      } else {
        this.values.set(name, widget.getValue());
      }
    }.bind(this)
    callback._callback = this;
    if (LSD.Mixin.Command.getCommandType.call(widget) == 'command')
      this.values.set(name, widget.getValue());
    widget.states.watch('checked', callback);
    var key = widget.lsd + ':value:callback'
    var callback = this.retrieve(key);
    if (!callback) {
      callback = function(value, old) {
        if (typeof old != 'undefined')
          this.values.unset(name, old);
        this.values.set(name, value)
      }.bind(this)
      this.store(key, callback)
    }
    widget.addEvent('change', callback);
    this.fields.set(name, widget)
  },
  
  getParams: function(object) {
    if (!object) object = this.values;
    var result = {};
    for (var name in object) {
      var value = object[name];
      if (value && !value.indexOf) value = value.nodeType ? value.getValue() : this.getParams(value);
      result[name] = value;
    }
    return result;
  },
  
  removeField: function(widget) {
    var name = widget.attributes.name;
    if (!name) return;
    widget.states.unwatch('checked', this);
    this.fields.unset(name, widget)
    this.values.unset(name, widget.getValue());
    var key = widget.lsd + ':value:callback'
    var callback = this.retrieve(key);
    if (callback) widget.removeEvent('change', callback);
  },
  
  getFieldsByName: function(fields, callback, root) {
    if (fields.call && (callback = fields)) fields = null;
    if (!fields) fields = this.elements;
    if (!callback && fields.indexOf) return root[fields]
    if (fields.map && fields.each && (!callback || !root)) return fields.map(function(field) {
      return this.getFieldsByName(field, callback, root)
    }.bind(this));
  },
  
  getModelName: function() {
    for (var name in this.fields) 
      if (this.fields.has(name))
        if (!this.fields[name].nodeType) return name;
  }
});

var Fieldset = Object.append(LSD.Mixin.Fieldset, {
  rNameIndexBumper: /(\[)(\d+?)(\])/,
  rIdIndexBumper:   /(_)(\d+?)(_|$)/,
  rNameMultiplier:  /(?:\[\])?$/,
  rPrefixAppender:  /^[^\[]+/,
  getName: function(model, name) {
    return model + name.replace(Fieldset.rPrefixAppender, function(match) {return '[' + match + ']'});
  },
  bumpName: function(string) {
    return string.replace(Fieldset.rNameIndexBumper, function(m, a, index, b) { 
      return a + (parseInt(index) + 1) + b;
    })
  },
  bumpId: function(string) {
    return string.replace(Fieldset.rIdIndexBumper, function(m, a, index, b) { 
      return a + (parseInt(index) + 1) + b;
    })
  },
  multiplyName: function(string) {
    return string.replace(Fieldset.rNameMultiplier, '[]')
  }
});

Fieldset.events = {
  request: {
    badRequest: 'parseFieldErrors'
  },
  self: {
    beforeNodeBuild: function(query, widget) {
      if (!widget.options.clone) return;
      var attrs = query.attributes, attributes = widget.attributes;
      var name = attributes.name, id = attributes.id;
      if (widget.tagName == 'label') var four = attributes['for'];
      for (var taken = this.fields.get(name); taken;) {
        // bump name index
        name = Fieldset.bumpName(name);
        // bump id index
        if (id) id = Fieldset.bumpId(id);
        // bump for attribute
        if (four) four = Fieldset.bumpId(four) || four;
        if (!name || !(taken = this.fields.get(name))) {
          if (name) (attrs || (attrs = {})).name = name;
          if (id) (attrs || (attrs = {})).id = id;
          if (four != null) (attrs || (attrs = {}))['for'] = four;
          if (attrs) query.attributes = attrs;
        }
      }
    }
  }
};

LSD.Behavior.define(':fieldset', 'fieldset');

}();