ART.Widget.Menu = new Class({
  Includes: [
    ART.Widget.Paint,
    Widget.Trait.Animation
  ],
  
  options: {
    animation: {
      duration: 0,
      value: 0
    }
  },
  
  position: 'absolute',
  
  name: 'menu',
  
	layered: {
	  shadow:  ['shadow'],
	  stroke:  ['stroke'],
	  background:  ['fill', ['backgroundColor']],
	  reflection:  ['fill', ['reflectionColor']],
	}
});