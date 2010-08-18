ART.Widget.Module.Expression = new Class({
	expression: false,
	
	applyExpression: function(expression) {
	  var parsed = Slick.parse(expression).expressions[0][0];
	  if (parsed.classes) {
	    var klasses = parsed.classes.map(function(klass) { return klass.value })
	    this.classes.push.apply(this.classes, klasses);
	    klasses.each(this.addClass.bind(this));
	  }
	  
	  var options = {};
	  if (parsed.id) options.id = parsed.id;
	  if (parsed.attributes) {
  		if (parsed.attributes) parsed.attributes.each(function(attribute) {
  			options[attribute.key] = attribute.value || true;
  		});
	  }  
  	if (parsed.attributes || parsed.id) $extend(this.options, options);
	  this.fireEvent('expression', [parsed, expression]);
	}
});