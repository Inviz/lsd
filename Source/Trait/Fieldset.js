/*
---
 
script: Fieldset.js
 
description: Wrapper around set of form fields
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Trait
 
provides: 
  - LSD.Trait.Fieldset
 
...
*/

LSD.Trait.Fieldset = new Class({
  options: {
    has: {
      many: {
        elements: {
          selector: ':read-write',
          callbacks: {
            'add': 'addField',
            'remove': 'removeField'
          }
        }
      }
    }
  },
  
  initializers: {
    fieldset: function() {
      this.names = {};
      this.params = {};
      return {
        events: {
          request: {
            request: 'validateFields',
            badRequest: 'parseFieldErrors'
          },
          self: {
            mutateLayout: function(query) {
              var element = query.element, name = element.name, id = element.id, mutation;
              var widget = Element.retrieve(element, 'widget');
              if (!widget) return;
              if (name && this.names[name]) {
                var bumped = LSD.Trait.Fieldset.bumpName(name);
                if (bumped) (mutation || (mutation = {attributes: {}})).attributes.name = bumped;
              }
              // bump id index
              if (id) {
                bumped = LSD.Trait.Fieldset.bumpId(id);
                if (bumped != id) (mutation || (mutation = {attributes: {}})).attributes.id = bumped;
              }
              // bump name index
              if (LSD.toLowerCase(element.tagName) == 'label') {
                var four = element.htmlFor
                if (four) {
                  bumped = LSD.Trait.Fieldset.bumpId(four);
                  if (bumped != four) (mutation || (mutation = {attributes: {}})).attributes['for'] = bumped;
                }
              }
              if (query.mutation) Object.append(query.mutation, mutation);
              else query.mutation = mutation;
            }
          }
        }
      }
    }
  },
  
  checkValidity: function() {
    var valid = true;
    for (var i = 0, element; element = this.elements[i++];) if (!element.checkValidity()) valid = false;
    return valid;
  },
  
  getData: function() {
    var data = {}
    for (var name in this.names) {
      var memo = this.names[name];
      if (memo.push) {
        for (var i = 0, radio; radio = memo[i++];) if (radio.checked) data[name] = radio.getValue(); break;
      } else if (memo.options.command.type != 'checkbox' || memo.checked) data[name] = memo.getValue();
    }
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
      console.log(name, field, errors[name])
      if (!field) continue;
      field.invalidate(errors[name]);
      this.invalid = true;
    }
  },

  parseFieldErrors: function(response) {
    var result = {}, errors = response.errors;
    if (errors) { //rootless response ({errors: {}), old rails
      for (var i = 0, error; error = errors[i++];)
        result[LSD.Trait.Fieldset.getName(this.getModelName(error[0]), error[0])] = error[1];
    } else { //rooted response (publication: {errors: {}}), new rails
      var regex = LSD.Trait.Fieldset.rPrefixAppender;
      for (var model in response) {
        var value = response[model], errors = value.errors;
        if (!errors) continue;
        for (var i = 0, error; error = errors[i++];)
          result[LSD.Trait.Fieldset.getName(model, error[0])] = error[1];
      }
    }
    if (Object.getLength(result) > 0) this.addFieldErrors(result);
  },
  
  addField: function(widget) {
    var name = widget.attributes.name, radio = (widget.options.command.type == 'radio');
    if (!name) return;
    if (radio) {
      if (!this.names[name]) this.names[name] = [];
      this.names[name].push(widget);
    } else this.names[name] = widget;
    for (var regex = LSD.Trait.Fieldset.rNameParser, object = this.params, match, bit;;) {
      match = regex.exec(name)
      if (bit != null) {
        if (!match) {
          if (!object[bit] && radio) object[bit] = [];
          if (object[bit] && object[bit].push) object[bit].push(widget);
          else object[bit] = widget;
        } else object = object[bit] || (object[bit] = (bit ? {} : []));
      }
      if (!match) break;
      else bit = match[1] ||match[2];
    }
    return object
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
    var name = widget.attributes.name, radio = (widget.options.command.type == 'radio');
    if (!name) return;
    if (radio) this.names[name].erase(widget);
    else delete this.names[name];
    for (var regex = LSD.Trait.Fieldset.rNameParser, object = this.params, match, bit;;) {
      match = regex.exec(name)
      if (bit != null) {
        if (!match) {
          if (radio) object[bit].erase(widget)
          else delete object[bit];
        } else object = object[bit];
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
  },

  getModelName: Macro.getter('modelName', function() {
    for (var name in this.params) if (!this.params[name].nodeType) return name;
  })
});
Object.append(LSD.Trait.Fieldset, {
  rNameIndexBumper: /(\[)(\d+?)(\])/,
  rIdIndexBumper: /(_)(\d+?)(_|$)/,
  rNameParser:      /(^[^\[]+)|\[([^\]]*)\]/ig,
  rPrefixAppender:  /^[^\[]+/i,
  getName: function(model, name) {
    return model + name.replace(LSD.Trait.Fieldset.rPrefixAppender, function(match) {return '[' + match + ']'});
  },
  bumpName: function(string) {
    return string.replace(LSD.Trait.Fieldset.rNameIndexBumper, function(m, a, index, b) { 
      return a + (parseInt(index) + 1) + b;
    })
  },
  bumpId: function(string) {
    return string.replace(LSD.Trait.Fieldset.rIdIndexBumper, function(m, a, index, b) { 
      return a + (parseInt(index) + 1) + b;
    })
  }
});