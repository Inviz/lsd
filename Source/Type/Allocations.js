LSD.Allocations = {
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