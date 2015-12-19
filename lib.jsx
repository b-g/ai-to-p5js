#target illustrator
var comma = ', ';

function run(runFunc){
	if (app.activeDocument) { 
		if (app.selection.length > 0) {
			showDialog( runFunc(app.selection).join('\r') );
		} else {
			alert ("Nothing Slected!");
		}
	}
}

function createFirstPoint(pageItems, i, k){
	var point = pageItems[i].pathPoints[(k-1)];
	var xy = [point.anchor[0], point.anchor[1]*-1];
	return xy;
}

function createPoints(pageItems, i, k){
	var point1 = pageItems[i].pathPoints[(k-1)];
	var point2 = pageItems[i].pathPoints[k];
	var dirRight = [point1.rightDirection[0] ,point1.rightDirection[1]*-1];
	var dirLeft = [point2.leftDirection[0] ,point2.leftDirection[1]*-1];
	var xy = [point2.anchor[0], point2.anchor[1]*-1];
	return {
		dirRight: dirRight,
		dirLeft: dirLeft,
		xy: xy
	};
}

function endPoint (pageItems, i, k, anz) {
	var old = k-anz
	var point1 = pageItems[i].pathPoints[k];
	var point2 = pageItems[i].pathPoints[old];
	var dirRight = [point1.rightDirection[0] ,point1.rightDirection[1]*-1];
	var dirLeft = [point2.leftDirection[0] ,point2.leftDirection[1]*-1];
	var xy = [point2.anchor[0], point2.anchor[1]*-1];
	return {
		dirRight: dirRight,
		dirLeft: dirLeft,
		xy: xy
	};
}

function isFill(pageItems, i, p5Code){
	if (pageItems[i].filled == true){
		var red = pageItems[i].fillColor.red;
		var green = pageItems[i].fillColor.green;
		var blue = pageItems[i].fillColor.blue;
		if (red == green && green == blue && blue == red){
			if (red == 255 && green == 255 && blue == 255){			
			} else {
			var gray = red;
				p5Code.push('fill('+ gray +');');
			}
		} else {
			p5Code.push('fill('+ red + comma + green + comma + blue +');');
		}
	} else {
		p5Code.push('noFill();');
	}
	return p5Code;
}

function exportBezierVertexShapes(pageItems){
	var p5Code = [];
	for (var i=0; i < pageItems.length; i+=1){
		var anz = 0;
		isFill(pageItems, i, p5Code);
		p5Code.push('beginShape();');
		for (var k=1; k<pageItems[i].pathPoints.length; k+=1){
			if (k==1){
				p5Code.push('vertex('+ formatValues(createFirstPoint(pageItems, i, k)).join(comma) +');');
				var point = createPoints(pageItems, i, k);
				p5Code.push('bezierVertex(' + formatValues(point.dirRight).join(comma) +comma + 
					formatValues(point.dirLeft).join(comma) + comma + 
					formatValues(point.xy).join(comma) + ');');
				anz+=1;
			} else {
				var point = createPoints(pageItems, i, k);
				p5Code.push('bezierVertex(' + formatValues(point.dirRight).join(comma) +comma + 
					formatValues(point.dirLeft).join(comma) + comma + 
					formatValues(point.xy).join(comma) + ');');
				anz+=1;
			}
			if (pageItems[i].closed == true && anz == pageItems[i].pathPoints.length-1){
				var point = endPoint(pageItems, i, k, anz);
				p5Code.push('bezierVertex(' + formatValues(point.dirRight).join(comma) +comma + 
				formatValues(point.dirLeft).join(comma) + comma + 
				formatValues(point.xy).join(comma) + ');');	
			}
		}
		p5Code.push('endShape();');
	}
	
	/*var p5Code="";
	var i=0;
		for (var k=1; k<pageItems[i].pathPoints.length; k+=1){

			var point1 = pageItems[i].pathPoints[(k-1)];
			var point2 = pageItems[i].pathPoints[k];
			
			for(var j=0;j<1;j++){
				p5Code+="bezier(";	
				var xy = [point1.anchor[0], point1.anchor[1]*-1];
				var dirRight = [point1.rightDirection[0] ,point1.rightDirection[1]*-1];
				xy = formatValues(xy);
				dirRight = formatValues(dirRight);
				p5Code+=xy.join(",")+","+dirRight.join(",")+",";
				var xy2 = [point2.anchor[0], point2.anchor[1]*-1];
				var dirLeft = [point2.leftDirection[0] ,point2.leftDirection[1]*-1];
				xy2 = formatValues(xy2);
				dirLeft = formatValues(dirLeft);
				p5Code+=dirLeft.join(",")+","+xy2.join(",");
				p5Code+=");";
			}
			p5CodeArr.push(p5Code);
			p5Code="";
		}	*/
	return p5Code;
}

function exportVertexShapes(pageItems){
	var p5Code = [];
	for (var i=0; i < pageItems.length; i+=1) {
		p5Code.push('beginShape();');
		for (var ii=0; ii < pageItems[i].pathPoints.length; ii+=1) {
			var point = pageItems[i].pathPoints[ii];
			var xy = [point.anchor[0], point.anchor[1]*-1];
			xy = formatValues(xy);
			p5Code.push('vertex('+ xy.join(comma) +');');
		}
		p5Code.push('endShape(CLOSE);');
	}
	return p5Code;
}

function exportEllipses(pageItems){
	var p5Code = [
		'ellipseMode(CENTER);'
	];
	for (var i=0, len=pageItems.length; i < len; i+=1) {
		isFill(pageItems, i, p5Code);
		pushMulti(p5Code, createEllipse(pageItems[i]));
	}
	return p5Code;
}

function exportRects(pageItems){
	var p5Code = [];
	for (var i=0, len=pageItems.length; i < len; i+=1) {
		isFill(pageItems, i, p5Code);
		pushMulti(p5Code, createRect(pageItems[i]));
	}
	return p5Code;
}

function createRect(item){
	var p5Code = getBounds(item);
	p5Code = formatValues(p5Code);
	return 'rect('+ p5Code.join(comma) +');';
}

function createEllipse(item){
	var bounds = getBounds(item);
	var x = bounds[0];
	var y = bounds[1];
	var w = bounds[2];
	var h = bounds[3];
	var p5Code = [
		x+w/2,
		y+h/2,
		w,
		h
	];
	p5Code = formatValues(p5Code);
	return 'ellipse('+ p5Code.join(comma) +');';
}

function pushMulti(targetArray, arrayOrValue) {
	if (arrayOrValue.isArray) {
		for (var i = 0; i < arrayOrValue.length; i++) {
			targetArray.push(arrayOrValue[i]);
		};		
	} else {
		targetArray.push(arrayOrValue);
	}
	return targetArray;
}

function showDialog(lines){
	var w = new Window("dialog", "ai to p5js"); 
	var myText = w.add("edittext", [0, 0, 512, 512], "", {multiline: true});
	myText.text = lines;
	myText.active = true;
	w.add("button", undefined, "Close", {name: "ok"});
	w.show();
 }

function getBounds(item) {
	var bbox = item.geometricBounds;
	var x = bbox[0];
	var y  = bbox[1]*-1;
	var w = (bbox[2]-x);
	var h = (bbox[3]-bbox[1])*-1;
	var p5Code = [x,y,w,h];
	return p5Code;
}

function formatValues(values) {
	var p5Code = [];
	for (var i = 0; i < values.length; i++) {
		p5Code[i] = Math.round(values[i]);
	};
	return p5Code;
}

function println(t){ $.writeln(t); }

if (!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}