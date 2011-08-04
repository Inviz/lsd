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
            'add': 'addField',
            'remove': 'removeField'
          }
        }
      }
    },
    expects: {
      ':form': function(widget, state) {
        widget[state ? 'addRelation' : 'removeRelation']('elements', {as: 'form'})
      }
    }
  },
  
  onMix: function() {
    this.names = {};
    this.params = {};
    this.addEvents(LSD.Mixin.Fieldset.events);
  },
  
  onUnmix: function() {
    this.removeEvents(LSD.Mixin.Fieldset.events);
  },
  
  checkValidity: function() {
    return this.elements.every(function(element) { 
      return element.checkValidity();
    });
  },
  
  getData: function() {
    var data = {}
    for (var name in this.names) {
      var memo = this.names[name];
      if (memo.push) {
        for (var i = 0, radio; radio = memo[i++];) if (radio.checked) data[name] = radio.toData(); break;
      } else {
        var value = memo.toData();
        if (value != null) data[name] = value;
      }
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
      for (var i = 0, error; error = errors[i++];)
        result[Fieldset.getName(this.getModelName(error[0]), error[0])] = error[1];
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
    var name = widget.attributes.name, radio = (widget.commandType == 'radio');
    if (!name || !widget.toData) return;
    if (radio) {
      if (!this.names[name]) this.names[name] = [];
      this.names[name].push(widget);
    } else this.names[name] = widget;
    for (var regex = Fieldset.rNameParser, object = this.params, match, bit;;) {
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
    var name = widget.attributes.name, radio = (widget.commandType == 'radio');
    if (!name) return;
    if (radio) this.names[name].erase(widget);
    else delete this.names[name];
    for (var regex = Fieldset.rNameParser, object = this.params, match, bit;;) {
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