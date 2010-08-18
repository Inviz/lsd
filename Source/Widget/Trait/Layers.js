(function() {

var empty = {translate: {x: 0, y: 0}, outside: {x: 0, y: 0}, inside: {x: 0, y: 0}};

ART.Widget.Trait.Layers = new Class({

  layers: {},

  build: Macro.onion(function() {
    if (this.layered) {
      for (var name in this.layered) {
        this.layers[name] = this.getLayer.apply(this, this.layered[name]);
      }
    }
  }),
  
  update: Macro.onion(function() {
    this.outside = {x: 0, y: 0};
    this.inside = {x: 0, y: 0};
  }),
  
  getLayer: function() {
    var args = Array.link($splat(arguments), {
      layer: String.type, 
      klass: Class.type,
      draw: Function.type,
      options: Object.type, 
      properties: Array.type,
      render: Function.type
    });
    var shape = this.getShape();
    var type = (args.klass || ART.Layer[args.layer.camelCase().capitalize()]);
    
    var instance = new type(shape); //combine shape & layer classes
    
    var injected = false;
    
    var properties = (instance.properties || []).concat(args.properties)
    
    this.addEvent('redraw', function() {
      value = instance.value || empty;
    
      var styles = this.getChangedStyles.apply(this, properties);
      //console.log('redraw', args.layer, this.selector, styles)
      if (styles) {
        instance.padding = this.inside;
        value = (args.draw || instance.paint).apply(instance, Hash.getValues(styles))
        if (value === false) {
          value = empty;
          if (injected) {
            instance.eject();
            injected = false;
          };
        } else {  
          value = $merge(empty, value);
          if (!injected) {
            instance.inject(this.paint);
            injected = true;
          } else {
            if (instance.update) instance.update(this.paint)
          }
        }
        instance.value = value;
      } else {
        //this.log('unchanged')
      } 
      instance.translate(value.translate.x + this.outside.x, value.translate.y + this.outside.y);
      this.outside.x += value.outside.x;
      this.outside.y += value.outside.y;
      //this.inside.x += value.inside.x;
      //this.inside.y += value.inside.y;
    });
    return instance;  
  }
});

})();
