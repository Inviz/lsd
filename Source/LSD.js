/*
---
 
script: LSD.js
 
description: LSD namespace definition
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - Core/Class
  - Core/Events
  - Core/Options
  - Core/Browser
  - Core/Object
  - Ext/States
  - Ext/Macro
  - Ext/Class.mixin
  - Ext/Object.Array
  - Slick/Slick.Finder
 
provides: 
  - LSD
 
...
*/

var LSD = function() {
  
};
LSD.prototype = {
  Layers: {
    shadow:     ['size', 'radius', 'shape', 'shadow'],
    stroke:     [        'radius', 'stroke', 'shape', 'fill'],
    background: ['size', 'radius', 'stroke', 'offset', 'shape', 'color'],
    foreground: ['size', 'radius', 'stroke', 'offset', 'shape', 'color'],
    reflection: ['size', 'radius', 'stroke', 'offset', 'shape', 'color'],
    icon:       ['size', 'scale', 'color', 'stroke', 'offset', 'shape', 'position','shadow'],
    glyph:      ['size', 'scale', 'color', 'stroke', 'offset', 'shape', 'position', 'shadow']
  },
  States: {
    built:    ['build',      'destroy'],
    attached: ['attach',     'detach'],
    hidden:   ['hide',       'show'],
    disabled: ['disable',    'enable'],
    active:   ['activate',   'deactivate'],
    focused:  ['focus',      'blur'],     
    selected: ['select',     'unselect'], 
    checked:  ['check',      'uncheck'],
    collapsed:['collapse',   'expand'],
    working:  ['busy',       'idle'],
    chosen:   ['choose',     'forget'],
    empty:    ['empty',      'fill'],
    invalid:  ['invalidate', 'unvalidate'],
    valid:    ['validate',   'unvalidate'],
    editing:  ['edit',       'finish'],
    placeheld:['placehold',  'unplacehold'],
    invoked:  ['invoke',     'revoke']
  },
  Attributes: {
    tabindex: Number,
    width:    Number,
    height:   Number,
    readonly: Boolean,
    disabled: Boolean,
    hidden:   Boolean,
    checked:  Boolean,
    multiple: Boolean,
    'class': function(value) {
      value.split(' ').each(this.addClass.bind(this));
    },
    style: function(value) {
      value.split(/\s*;\s*/).each(function(definition) {
        this.setStyle.apply(this, definition.split(/\s*:\s*/))
      }, this);
    }
  },
  Properties: {
    events:       'Events',
    states:       'States',
    pseudos:      'Pseudos',
    attributes:   'Attributes',
    classes:      'Classes',
    dataset:      'Dataset',
    variables:    'Variables',
    mixins:       'Mixins',
    properties:   'Properties',
    shortcuts:    'Shortcuts',
    styles:       'Styles',
    layouts:      'Layout',
    allocations:  'Allocations',
    relations:    'Relations',
    expectations: 'Expectations',
    matches:      'Matches',
    mutations:    'Mutations',
    proxies:      'Proxies',
    layers:       'Layers',
    shape:        'Shape',
    document      'Document',
    command       'Command',
    id:           'attributes.id',
    commandType:  'command.type',
    context: function(value, state, old) {
      var source = this.source;
      if (source) this.unset('source', source);
      if (state) {
        if (typeof value == 'string') {
          var camel = LSD.toClassName(value);
          this.factory = LSD.global[this.options.namespace][camel];
          if (!this.factory) throw "Can not find LSD.Type in " + ['window', this.options.namespace, camel].join('.');
        } else {
          this.factory = value;
        }
      }
      if (source) this.set('source', source);
    },
    tag: function(value, state, old) {
      if (!this.options.source && this.prepared) {
        if (state && value) this.set('source', value)
        else if (old) this.unset('source', value);
      }
    },
    source: function(value, state, old) {
      if (state && value) {
        var role = LSD.Module.Properties.getRole(this);
        if (role && this.role === role) return;
      }
      if (this.prepared) {
        if (state) {
          this.set('role', role);
        } else if (this.role) {
          this.unset('role', this.role);
        }
      }
    },
    role: function(value, state, old) {
      if (state) {
        if (role == null) role = this.getRole(this)
        if (role) {
          this.mixin(role);
          if ((this.sourced = this.captureEvent('setRole', role)))
            this.setOptions(this.sourced);
        }
        return role;
      } else {
        this.unmix(role);
        var options = this.sourced;
        if (options) {
          delete this.sourced;
          this.unsetOptions(options);
        }
      }
    },
    scope: function(value, state, old) {
      if (state) return LSD.Script.Scope.setScope(this, value)
      else if (old) LSD.Script.Scope.unsetScope(this, value);
    }
  },
  Relations: {
    selectable: {
      scopes: {
        selected: {
          filter: ':selected',
          callbacks: {
            add: function(widget) {
              if (this.setValue) this.setValue(widget);
              this.fireEvent('set', widget);
            },
            remove: function(widget) {
              if (widget.getCommandType() != 'checkbox') return;
              if (this.setValue) this.setValue(widget, true);
              this.fireEvent('unset', widget);
            }
          }
        }
      },
      states: {
        add: Array.object('selected')
      }
    },
    contextmenu: {
      as: 'initiator',
      tag: 'menu',
      attributes: {
        type: 'context'
      },
      proxy: function(widget) {
        return widget.pseudos.item;
      },
      states: {
        set: {
          collapsed: 'hidden'
        },
        get: {
          hidden: 'collapsed'
        }
      }
    }
  },
  Allocations: {
    lightbox: {
      source: 'body[type=lightbox]'
    },
    dialog: {
      multiple: true,
      source: 'body[type=dialog]',
      options: function(options, kind) {
        if (kind) return {attributes: {kind: kind}}
      }
    },
    menu: {
      source: 'menu[type=context]'
    },
    scrollbar: {
      source: 'scrollbar'
    },
    container: {
      source: '.container',
      proxy: {
        type: 'promise',
        mutation: true,
        priority: -1,
        rewrite: false
      }
    },
    message: {
      source: 'p.message',
      parent: 'document',
      options: function(options, type, message) {
        var opts = {}
        opts.content = message;
        if (type) opts.classes = Array.object(type);
        return opts;
      }
    },
    editableField: {
      options: function(options, type, name) {
        return Object.merge(
          {source: type == 'area' ? 'textarea' : ('input' + (type ? '[type=' + type : ']'))}, 
          name ? {attributes: {name: name}} : null
        )
      }
    },
    input: function(options, type, name) {
      return new Element('input', Object.merge({
        type: type || 'text',
        name: name
      }, options));
    },
    submit: function(options) {
      var widget = this;
      return new Element('input', Object.merge({
        type: 'submit',
        styles: {
          width: 1,
          height: 0,
          margin: 0,
          display: 'block',
          border: 0,
          padding: 0,
          overflow: 'hidden',
          position: 'absolute'
        }
      }, options));
    }
  }
};
this.LSD = LSD = new LSD;
