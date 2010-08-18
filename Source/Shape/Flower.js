ART.Shape.Flower = new Class({
	
	Extends: ART.Shape,
	
	properties: ['width', 'height', 'star-rays', 'star-radius'],
	
	initialize: function(width, height){
		this.parent();
		if (width != null && height != null) this.draw(width, height);
	},
	
	paint: function(width, height, leaves, radius){
 		var path = new ART.Path;
 		outside = width / 2;
 		var cx = width / 2;
 		var cy = cx
 		inside = outside * (radius || 0.5) 
 		
    leaves = Math.max(leaves || 0, 5);
    path.move(0, inside);
    var points = ["M", cx, cy + rin, "Q"],
        R;
    for (var i = 1; i < leaves * 2 + 1; i++) {
        R = i % 2 ? rout : rin;
        points = points.concat([+(cx + R * Math.sin(i * Math.PI / n)).toFixed(3), +(cy + R * Math.cos(i * Math.PI / n)).toFixed(3)]);
    }
    points.push("z");
    return this.path(points);
    
    
		return path.close();
	},

	change: function(delta) {
	  return this.paint(this.style.width + delta * 2, this.style.height + delta * 2);
	},

	getOffset: function(styles, offset) {
		var stroke = (styles.strokeWidth || 0);
		return {
			left: ((styles.width == 'auto') ? Math.max(stroke - offset.left, 0) : stroke),
			top: 0,
			right: ((styles.width == 'auto') ? Math.max(stroke - offset.right, 0) : stroke),
			bottom: stroke
		}
	}

});  

//Raphael.fn.flower = function (cx, cy, rout, rin, n) {
//    rin = rin || rout * .5;
//    n = +n < 3 || !n ? 5 : n;
//    var points = ["M", cx, cy + rin, "Q"],
//        R;
//    for (var i = 1; i < n * 2 + 1; i++) {
//        R = i % 2 ? rout : rin;
//        points = points.concat([+(cx + R * Math.sin(i * Math.PI / n)).toFixed(3), +(cy + R * Math.cos(i * Math.PI / n)).toFixed(3)]);
//    }
//    points.push("z");
//    return this.path(points);
//};
