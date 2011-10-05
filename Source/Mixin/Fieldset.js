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
              filter: '[name]:valued'
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
        this.names = new LSD.Object.Stack;
        this.fields = new LSD.Object.Stack;
        this.params = new LSD.Object.Stack;
      } else {
        delete this.names;
        delete this.params;
        delete this.field;
      }
      this[state ? 'addEvents' : 'removeEvents'](LSD.Mixin.Fieldset.events);
      this.variables[state ? 'set' : 'unset']('params', this.params);
      this.variables[state ? 'set' : 'unset']('fields', this.fields);
    }
  },
  
  checkValidity: function() {
    return this.elements.every(function(element) { 
      return element.checkValidity();
    });
  },
  
  getData: function() {
    var data = {}
    this.submittableElements.each(function(element) {
      data[element.attributes.name] = element.toData();
    });
    return data;
  },

  getRequestData: function() {
    return this.getData();
  },
  
  reset: function() {
    
  },
  
  addFieldErrors: function(errors) {
    for (var name in errors) {
      var field = this.names[name];
      if (!field) continue;
      field.invalidate(errors[name]);
    }
    this.errors = errors;
    this.addEvent('beforeSubmit:once', this.removeFieldErrors);
  },
  
  removeFieldErrors: function() {
    var errors = this.errors;
    for (var name in errors) {
      var field = this.names[name];
      if (!field) continue;
      if (field.invalid) field.setStateTo('invalid', false);
    }
    delete this.errors
  },

  parseFieldErrors: function(response) {
    var result = {}, errors = response.errors;
    if (errors) { //rootless response ({errors: {}), old rails
      if (errors.push) {
        for (var i = 0, error; error = errors[i++];)
          result[Fieldset.getName(this.getModelName(error[0]), error[0])] = error[1];
      } else {
        for (var name in errors)
          result[Fieldset.getName(this.getModelName(name), name)] = errors[name];
      }
    } else { //rooted response (publication: {errors: {}}), new rails
      var regex = Fieldset.rPrefixAppender;
      for (var model in response) {
        var value = response[model]; 
        if (!(errors = value.errors)) continue;
        for (var i = 0, error; error = errors[i++];)
          result[Fieldset.getName(model, error[0])] = error[1];
      }
    }
    if (Object.getLength(result) > 0) this.addFieldErrors(result);
  },
  
  addField: function(widget) {
    var name = widget.attributes.name;
    if (!name || !widget.toData) return;
    this.names.set(name, widget);
    var params = this.params, fields = this.fields;
    for (var regex = Fieldset.rNameParser, match, bit;;) {
      match = regex.exec(name)
      if (bit != null) {
        if (!match) {
          fields.set(bit, widget);
          params.set(bit, widget.getValue());
          var key = widget.lsd + ':value:callback'
          var callback = this.retrieve(key);
          if (!callback) {
            callback = function(value) {
              params.set(bit, value)
            }
            this.store(key, callback)
          }
          widget.addEvent('change', callback);
        } else {
          params = params[bit] || (params[bit] = new LSD.Object.Stack);
          fields = fields[bit] || (fields[bit] = new LSD.Object.Stack);
        }
      }
      if (!match) break;
      else bit = match[1] ||match[2];
    }
  },
  
  getParams: function(object) {
    if (!object) object = this.params;
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
    this.names.unset(name, widget);
    var params = this.params, fields = this.fields;
    for (var regex = Fieldset.rNameParser, match, bit;;) {
      match = regex.exec(name)
      if (bit != null) {
        if (!match) {
          fields.unset(bit, widget);
          params.unset(bit, widget.getValue());
          var key = widget.lsd + ':value:callback'
          var callback = this.retrieve(key);
          if (callback) widget.removeEvent('change', callback);
        } else {
          params = params[bit];
          fields = fields[bit];
        }
      }
      if (!match) break;
      else bit = match[1] ||match[2];
    }
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
    for (var name in this.params) if (!this.params[name].nodeType) return name;
  }
});

var Fieldset = Object.append(LSD.Mixin.Fieldset, {
  rNameIndexBumper: /(\[)(\d+?)(\])/,
  rIdIndexBumper:   /(_)(\d+?)(_|$)/,
  rNameParser:      /(^[^\[]+)|\[([^\]]*)\]/g,
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
      // bump name index
      if (name) (attrs || (attrs = {})).name = Fieldset.bumpName(name) || name;
      // bump id index
      if (id) (attrs || (attrs = {})).id = Fieldset.bumpId(id) || id;
      if (widget.tagName == 'label') {
        var four = attributes['for'];
        if (four) (attrs || (attrs = {}))['for'] = Fieldset.bumpId(four) || four;
      }
      if (attrs) query.attributes = attrs;
    }
  }
};

LSD.Behavior.define(':fieldset', 'fieldset');

}();