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
      snap: 5,
      constrain: true,
      revert: true
    },
    pseudos: Array.object('activatable'),
    events: {
      self: {
        mousedown: 'onBeforeSortStart'
      }
    }
  },
  
  getSortables: function() {
    if (this.sortables) return this.sortables;
    var options = Object.append({}, this.options.sortables);
    if (options.clone === true) options.clone = function(event, element){
      var widget = element.uid && element.retrieve('widget');
      var clone = element.cloneNode(true);
      document.id(clone).addEvent('mousedown', function(event){
        element.fireEvent('mousedown', event);
      }).addClass('clone').store('origin', widget).setStyles({
        margin: 0,
        position: 'absolute',
        visibility: 'hidden',
        width: element.getStyle('width')
      }).setPosition(element.getPosition(element.getOffsetParent()));
      return clone.inject(this.list);
    };
    delete options.snap;
    this.sortables = new Sortables([], options);
    this.properties.set('sortables', this.sortables);
    this.sortables.addEvents(this.bind({
      start: 'onSortStart',
      complete: 'onSortComplete',
      sort: 'onSort'
    }))
    var self = this;
    this.sortables.insert = function(dragging, element) {
      if (self.onBeforeSort.apply(self, arguments)) {
        (dragging.retrieve('origin') || dragging).fireEvent('beforeMove', element);
        var where = 'inside';
        if (this.lists.contains(element)){
          this.list = element;
          this.drag.droppables = this.getDroppables();
        } else {
          where = this.element.getAllPrevious().contains(element) ? 'before' : 'after';
        };
        (this.element.uid && this.element.retrieve('widget') || this.element).inject(element, where);
        this.fireEvent('sort', [this.element, this.clone]);
      }
    };
    return this.sortables;
  },
  
  onBeforeSort: function(dragging, element) {
    return true;
  },
  
  onBeforeSortStart: function(event) {
    for (var target = event.target, widget; target && target.tagName; target = target.parentNode) {
      if (target == this.element) break;
      switch (LSD.toLowerCase(target.tagName)) {
        case "select": case "input": case "textarea":
          return;
      }
      widget = target.uid && Element.retrieve(target, 'widget');
      if (widget && widget.pseudos.reorderable) {
        if (widget.getHandle) {
          var handle = widget.getHandle();
          if (!(handle == event.target || handle.contains(event.target))) return;
        }
        var snap = widget.options.snap || this.options.sortables.snap || 0;
        var start = event.page, self = this;
        if (snap > 0) {
          var events = {
            mousemove: function(event) {
              var distance = Math.round(Math.sqrt(Math.pow(event.page.x - start.x, 2) + Math.pow(event.page.y - start.y, 2)));
              if (distance > snap) self.getSortables().start(event, widget.element);
            },
            mouseup: function() {
              document.body.removeEvents(events);
            }
          };
          document.body.addEvents(events);
        } else {
          this.getSortables().start(event, widget.element)
        }
        break;
      }
    };
  },

  onSortStart: function(element) {
    var widget = element.retrieve('widget');
    widget.addClass('moved');
    widget.fireEvent('moveStart');
  },
  
  onSortComplete: function(element) {
    var widget = element.retrieve('widget');
    widget.removeClass('moved');
    widget.fireEvent('moveComplete');
  },
  
  onSort: function(element) {
    var widget = element.retrieve('widget');
    widget.fireEvent('move');
    this.fireEvent('sort', [widget, element]);
  }
  
});

LSD.Behavior.define(':sortable', 'sortable');