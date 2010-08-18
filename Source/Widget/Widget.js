(function(Old) {
  // you can specify ART.Widget.modules as an array of classes to disable autoloading
  if (!Old.modules) {
    Old.modules = []
    for (var name in Old.Module) Old.modules.push(Old.Module[name]);
  }

  ART.Widget = new Class({

    States: {
  	  'hidden': ['hide', 'show'],
  	  'active': ['activate', 'deactivate'],
  	  'focused': ['focus', 'blur'],
  	  'disabled': ['disable', 'enable'],
  	  'built': ['build', 'destroy', false],
  		'attached': ['attach', 'detach', false],
  	  'dirty': ['update', 'render', false]
    },
    
    Includes: [Old.Base, Widget.modules, Old.modules].flatten(),
    
    ns: 'art',
    name: 'widget',
    
    options: {
      classes: [],
      element: {
        tag: 'div'
      }
    },
    

    initialize: function(options) {
      this.setOptions(options);
      
  		this.update();
  	  this.offset = {
        paint: {},
        total: {},
        inside: {},
        padding: {},
        margin: {}
      }
      
      this.parent.apply(this, arguments);
      
  		if (this.expression) this.applyExpression(this.expression);
  		if (this.layout) this.setLayout(this.layout);
    }
  });
    
  ['Ignore', 'Module', 'Trait', 'modules', 'create', 'count'].each(function(property) { 
    ART.Widget[property] = Old[property]
  });
  ART.Widget.Base = Old.Base;

})(ART.Widget);