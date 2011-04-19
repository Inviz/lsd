/*
---
 
script: Edit.js
 
description: Turn element into editable mode
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action
  - Native/LSD.Native.Body
  - LSD.Trait.Form
  - LSD.Trait.Fieldset
  - LSD.Mixin.Resource

provides:
  - LSD.Action.Edit

...
*/

LSD.Action.Edit = LSD.Action.build({
  enable: function(target, content) {
    var session = this.retrieve(target);
    if (!session) {
      $ss = session = new LSD.Native.Form.Edit(target.element || target);
      this.store(target, session);
    }
    session.start(content);
  },
  
  disable: function(target) {
    var session = this.retrieve(target);
    if (session) session.hide();
  }
});

LSD.Native.Form.Edit = new Class({
  Includes: [
    LSD.Native.Body,
    LSD.Trait.Fieldset,
    LSD.Trait.Form,
    LSD.Mixin.Resource
  ],
  
  options: {
    independent: true,
    layout: {
      extract: true,
      instance: true,
      children: {
        '::canceller': 'Cancel',
        '::submitter': 'Save'
      }
    },
    events: {
      self: {
        'cancel': 'finish'
      }
    },
    states: {
      hidden: true,
      editing: {
        enabler: 'start',
        disabler: 'finish'
      }
    },
    has: {
      one: {
        submitter: {
          selector: 'input[type=submit]'
        },
        canceller: {
          selector: 'button.cancel',
          events: {
            click: 'cancel'
          }
        }
      }
    }
  },
  
  initialize: function() {
    this.objects = [];
    this.parent.apply(this, arguments);
  },
  
  start: function(values) {
    console.log(values)
    Element.Item.walk.call(this, this.element, function(node, prop, scope, prefix) {
      var editable = node.getProperty('editable');
      if (editable) {
        if (prefix) prop = prefix.concat(prop).map(function(item, i) {
          return i == 0 ? item : '[' + item + ']'
        }).join('');
        this.convert(node, prop, editable);
      }
      return prefix;
    }, null, true);
    if (this.controls) this.controls.each(function(child) {
      this.element.appendChild(child.element);
    }, this);
  },

  finish: function() {
    for (var object; object = this.objects.shift();) this.revert(object);
    this.controls = this.getElements(':not(:read-write)').map(function(child) {
      child.element.parentNode.removeChild(child.element)
      return child;
    });
  },
  
  convert: function(element, name, type) {
    this.objects.push(element)
    return this.getReplacement(element, name, type).replaces(element);
  },
  
  revert: function(element) {
    element.replaces(Element.retrieve(element, 'widget:edit'));
  },
  
  cancel: function() {
    console.log('cancel, buyt why?')
    this.fireEvent('cancel', arguments)
  },
  
  submit: function() {
    console.log('submit')
    if (this.getResource) {
      var Resource = this.getResource();
      new Resource(Object.append(this.getParams(), {id: this.attributes.itemid})).save(function(html) {
        this.execute({name: 'replace', target: this.element}, html);
      }.bind(this));
    }
  },
  
  getReplacement: function(element, name, type) {
    var widget = Element.retrieve(element, 'widget:edit');
    if (!widget) {
      var options = {name: name};
      widget = this.buildLayout(type == 'area' ? 'textarea' : ('input-' + (type || 'text')), this, options);
      Element.store(element, 'widget:edit', widget);
    }
    widget.setValue(Element.get(element, 'itemvalue'));
    return widget;
  }
})