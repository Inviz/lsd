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
    events :{
      request: {
        request: 'validateFields',
        badRequest: 'addFieldErrors'
      },
      _fieldset: {
        layoutTransform: function(query) {
          var element = query.element, name = element.name, id = element.id, transformation;
          var widget = Element.retrieve(element, 'widget');
          if (!widget) return;
          if (name && this.names[name]) {
            var bumped = LSD.Trait.Fieldset.bumpName(name);
            if (bumped) (transformation || (transformation = {attributes: {}})).attributes.name = bumped;
          }
          // bump id index
          if (id) {
            bumped = LSD.Trait.Fieldset.bumpId(id);
            if (bumped != id) (transformation || (transformation = {attributes: {}})).attributes.id = bumped;
          }
          // bump name index
          if (LSD.toLowerCase(element.tagName) == 'label') {
            var four = element.htmlFor
            if (four) {
              bumped = LSD.Trait.Fieldset.bumpId(four);
              if (bumped != four) (transformation || (transformation = {attributes: {}})).attributes['for'] = bumped;
            }
          }
          if (query.transformation) Object.append(query.transformation, transformation);
          else query.transformation = transformation;
        }
      }
    },
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
  
  initialize: function() {
    this.names = {};
    this.params = {};
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
    var name = widget.attributes.name;
    if (!name) return;
    if (typeof object != 'object') {
      this.names[name] = widget;
      object = this.params;
    }
    //for (var regex = LSD.Trait.Fieldset.rNameParser, match, bit;;) {
    //  match = regex.exec(name)
    //  if (bit != null) {
    //    if (!match) {
    //      if (object[bit] && object[bit].push) object[bit].push(widget);
    //      else object[bit] = widget;
    //    } else object = object[bit] || (object[bit] = (bit ? {} : []));
    //  }
    //  if (!match) break;
    //  else bit = match[1] ||match[2];
    //}
    //return object
  },
  
  removeField: function(widget, object) {
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
Object.append(LSD.Trait.Fieldset, {
  rNameIndexBumper: /(\[)(\d+?)(\])/,
  rIdIndexBumper: /(_)(\d+?)(_|$)/,
  rNameParser:      /(^[^\[]+)|\[([^\]]*)\]/ig,
  rPrefixAppender:  /^[^\[]+/i,
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