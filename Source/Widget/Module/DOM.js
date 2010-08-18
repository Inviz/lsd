ART.Widget.Module.DOM = new Class({
  initialize: function() {
    this.childNodes = [];
    this.nodeType = 1;
    this.parentNode = this.nextSibling = this.previousSibling = null;
    this.parent.apply(this, arguments);
    this.nodeName = this.name;
  },
  
  getElementsByTagName: function(tagName) {
    var found = [];
    var all = tagName == "*";
    for (var i = 0, child; child = this.childNodes[i]; i++) {
      if (all || tagName == child.nodeName) found.push(child);
      found.push.apply(found, child.getElementsByTagName(tagName))
    }
    return found;
  },
  
  getAttributeNode: function(attribute) {
    return {
      nodeName: attribute,
      nodeValue: this.getAttribute(attribute)
    }
  },
  
	getChildren: function() {
	  return this.childNodes;
	},

  getRoot: function() {
    var widget = this;
    while (widget.parentNode) widget = widget.parentNode;
    return widget;
  },
  
  getHierarchy: function() {
    var widgets = [this];
    var widget = this;
    while (widget.parentNode) {
      widget = widget.parentNode;
      widgets.unshift(widget)
    }
    return widgets;
  },
  
	setParent: function(widget){
	  var siblings = widget.childNodes;
	  var length = siblings.length;
	  if (length == 1) widget.firstChild = this;
	  widget.lastChild = this;
	  var previous = siblings[siblings.length - 2];
	  if (previous) {
  	  previous.nextSibling = this;
  	  this.previousSibling = previous;
	  }
	  this.parentNode = widget;
	},

	adopt: function(widget) {
		if (widget.options.id) {
			if (this[widget.options.id]) this[widget.options.id].dispose();
			this[widget.options.id] = widget;
		}
		this.childNodes.push(widget);
	  if (!(this instanceof ART.Document)) widget.setParent(this);
	  $(this).adopt(widget);
		this.fireEvent('adopt', [widget, widget.options.id])

	  var parent = widget;
	  while (parent = parent.parentNode) parent.fireEvent('hello', widget)
	},
	
	inject: function(widget, quiet) {
		widget.adopt(this);
		var element = $(widget);
		this.fireEvent('inject', arguments);
		this.fireEvent('afterInject', arguments);
		var isDocument = (widget instanceof ART.Document);
		if (((element == widget) || isDocument) && (quiet !== true)) {
		  var postponed = false
    	this.render();
		  this.walk(function(child) {
		    if (child.postponed) {
		      postponed = true;
		      child.update();
		    }
		    if (isDocument) child.document = document;
		    child.fireEvent('dominject', element);
		    child.dominjected = true;
		  });
		  if (postponed && !this.dirty) this.dirty = true;
    	this.render();
		}
	},
	
	dispose: function() {
	  var parent = this.parentNode;
	  parent.childNodes.erase(this);
	  if (parent.firstChild == this) delete parent.firstChild;
	  if (parent.lastChild == this) delete parent.lastChild;
	  delete this.parentNode;
	  return this.parent.apply(this, arguments);
	},
	
	walk: function(callback) {
	  callback(this);
	  this.childNodes.each(function(child) {
	    child.walk(callback)
	  });
	},
	
	collect: function(callback) {
	  var result = [];
	  this.walk(function(child) {
	    if (!callback || callback(child)) result.push(child);
	  });
	  return result;
	},

	match: function(selector) {
	  return ART.Sheet.match(selector, this.getHierarchy())
	}
})