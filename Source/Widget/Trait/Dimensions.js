ART.Widget.Trait.Dimensions = new Class({
	size: {},
	
	setSize: function(width, height) {
		var size = {width: width,	height: height};
		$extend(this.options, size);
		this.refresh(size);
	},
	
	setHeight: function(value, light) {
	  value = Math.max(this.style.current.minHeight || 0, value);
		if (!light && (this.size.height == value)) return;
		this.size.height = value;
		if (!light) this.setStyle('height', value);
		return true;
	},
		
	setWidth: function(value, light) {
	  value = Math.max(this.style.current.minWidth || 0, value);
		if (this.size.width == value) return;
		this.size.width = value;
		if (!light) this.setStyle('width', value);
		return true;
	},
	
	getClientHeight: function() {
	  var styles = this.style.current;
	  var height = styles.height;
  	if (!height || (height == "auto")) {
  	  height = this.element.offsetHeight;
  	  if (height > 0) height -= ((this.offset.padding.top || 0) + (this.offset.padding.bottom || 0))
		}
		height += styles.paddingTop || 0;
		height += styles.paddingBottom || 0;
		return height;
	},
	
	getClientWidth: function() {
	  var width = this.element.offsetWidth;
	  if (width > 0) {
  	  var styles = this.style.current;
	    var parent = this.parentNode;
	    if (styles.width == "auto" && styles.display != "block") width -= ((this.offset.inside.left || 0) + (this.offset.inside.right || 0)) 
	    width -= ((this.offset.paint.left || 0) + (this.offset.paint.right || 0)) 
	  }
		return width;
	},
	
	getOffsetHeight: function() {;
	  var styles = this.style.current;
		var height = this.getClientHeight();
		height += (styles.strokeWidth || 0) * 2
		height += styles.borderBottomWidth || 0;
		height += styles.borderTopWidth || 0;
		return height;
	},
	
	getOffsetWidth: function() {
	  var styles = this.style.current;
		var width = this.getClientWidth();
		width += (styles.strokeWidth || 0) * 2
		width += styles.borderLeftWidth || 0;
		width += styles.borderBottomWidth || 0;
		return width;
	},
	
	getLayoutHeight: function() {
		var height = this.getOffsetHeight();
		height += ((this.offset.padding.top || 0) - (this.offset.inside.top || 0));
		height += ((this.offset.padding.bottom || 0) - (this.offset.inside.bottom || 0));
		return height;
	},

	getLayoutWidth: function() {
		var width = this.getOffsetWidth();
		width += ((this.offset.inside.left || 0) + (this.style.current.marginLeft || 0));
		width += ((this.offset.inside.right || 0) + (this.style.current.marginRight || 0));
		return width;
	}
	
})