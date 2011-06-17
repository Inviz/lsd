/*
---
 
script: Sortable.js
 
description: Reorder widgets as you please
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - More/Sortables
  - LSD.Mixin
 
provides:
  - LSD.Mixin.Sortable
 
...
*/

LSD.Mixin.Sortable = new Class({
  options: {
    sortables: {
      clone: true,
      constrain: true
    },
    pseudos: Array.fast('activatable'),
    events: {
      self: {
        mousedown: function(event) {
          for (var target = event.target, widget; target && target.tagName; target = target.parentNode) {
            if (target == this.element) break;
            widget = target.uid && Element.retrieve(target, 'widget');
            if (widget && widget.pseudos.reorderable) {
              this.getSortables().start(event, widget.element);
              break;
            }
          };
        }
      }
    }
  },
  
  getSortables: Macro.getter('sortables', function() {
    var sortables = new Sortables([], this.options.sortables);
    this.addEvent('sort', this.bindEvent('onSort'))
  }),
  
  onSort: function(element) {
    var widget = this.retrieve('widget');
    this.fireEvent('sort', [widget, element]);
    widget.fireEvent('move', [widget])
  }
  
});

LSD.Behavior.define(':sortable', LSD.Mixin.Sortable);