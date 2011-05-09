LSD.Module.Allocated = new Class({
  
  options: {
    allocated: {
      dialog: {
        datepicker
      }
    }
  },
  
  initializers: {
    allocated: function() {
      this.allocated = []
    }
  },
  
  require: function(type, name) {
    var allocation = LSD.Allocated[type];
    if (allocation) {
      if (allocation.multiple) {
        var group = this.allocated[type] || (this.allocated[type] = {});
        if (group[name]) return group[name];
      } else {
        if (this.allocated[type]) return this.allocated[type];
      }
      this.allocate
    }
  },
  
  allocate: function(type, name) {
    var allocation = LSD.Allocated[type], allocations;
    if (allocation) {
      if (allocation.multiple) {
        var group = allocations[type] || (allocations[type] = {});
        if (group[name]) return group[name];
        var options = this.options.allocated[type];
        if (options) options = [name];
      } else {
        if (allocations[type]) return allocations[type];
        var options = this.options.allocated[type];
      }
      var allocated = this.allocate(type, name, options);
      if (group) group[name] = allocated;
      else allocations[name] = true;
    }
  },
  
  release: function(type, name) {
    
  }
  
});

LSD.Allocated = {
  input: {
    layout: function() {
      
    }
  },
  
  dialog: {
    multiple: true,
    initialize: function(type) {
      return {
        layout: 'body-dialog' + (type ? '-' + type : '')
      }
    }
  },
  
  menu: {
    selector: 'menu[type=context]',
    proxy: function(widget) {
      return widget.pseudos.item;
    },
    states: {
      set: {
        expanded: 'hidden'
      }
    }
  },
  
  scrollbar: {
    
  },
  
  editor: function(name, type) {
    return {
      options: {
        attributes: {
          name: name
        }
      },
      layout: type == 'area' ? 'textarea' : ('input-' + (type || 'text')
    }
  },
  
  submit: function() {
    return new Element('input', {
      type: 'submit',
      styles: {
        width: 1,
        height: 0,
        display: 'block',
        border: 0,
        padding: 0,
        overflow: 'hidden',
        position: 'absolute'
      },
      events: {
        click: function(e) {
          e.preventDefault()
        }
      }
    });
  }
}


