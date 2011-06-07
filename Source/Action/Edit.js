/*
---
 
script: Edit.js
 
description: Turn element into editable mode
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action
  - Widgets/LSD.Widget.Body
  - Widgets/LSD.Widget.Form
  - LSD.Mixin.Fieldset
  - LSD.Mixin.Resource

provides:
  - LSD.Action.Edit

...
*/

LSD.Action.Edit = LSD.Action.build({
  enable: function(target, content) {
    var session = this.retrieve(target);
    if (!session) {
      $ss = session = new LSD.Widget.Form.Edit(target.element || target);
      this.store(target, session);
    }
    session.edit(content);
  },
  
  disable: function(target) {
    var session = this.retrieve(target);
    if (session) session.hide();
  }
});

LSD.Widget.Form.Edit = new Class({
  options: {
    key: null,
    layout: {
      '::canceller': 'Cancel',
      '::submitter': 'Save'
    },
    events: {
      self: {
        'cancel': 'finish'
      }
    },
    states: Array.fast('editing', 'hidden'),
    pseudos: Array.fast('form', 'fieldset', 'resource', 'command'),
    has: {
      one: {
        submitter: {
          selector: '[type=submit]',
          source: 'input[type=submit]'
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
  
  edit: function(values) {
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
    //console.log('revert', [].concat(this.objects))
    for (var object; object = this.objects.shift();) this.revert(object);
    this.submitter.dispose();
    this.canceller.dispose();
  },
  
  convert: function(element, name, type) {
    this.objects.push(element)
    return this.getReplacement(element, name, type).replaces(element);
  },
  
  revert: function(element) {
    element.replaces(Element.retrieve(element, 'widget:edit'));
  },
  
  cancel: function() {
    this.fireEvent('cancel', arguments)
  },
  
  submit: function() {
    if (this.getResource) {
      var Resource = this.getResource();
      new Resource(Object.append(this.getParams(), {id: this.attributes.itemid})).save(function(html) {
        this.execute({action: 'replace', target: this.element}, html);
      }.bind(this));
    }
  },
  
  getReplacement: function(element, name, type) {
    var widget = Element.retrieve(element, 'widget:edit');
    if (!widget) {
      var options = {attributes: {name: name}};
      widget = this.buildLayout(type == 'area' ? 'textarea' : ('input-' + (type || 'text')), this, options);
      
      Element.store(element, 'widget:edit', widget);
    }
    //widget.setValue(Element.get(element, 'itemvalue'));
    return widget;
  }
});