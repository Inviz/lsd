
LSD.Relation.Traits = {
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
};
