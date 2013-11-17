(function(){
    function cap(low, high) {
	return function(value){ return Math.max(low, Math.min(high, value)); }
    }

    var unit = cap(0,1);

    function scale(range){
	return function(value){ return Math.ceil(range * unit(value)); }
    }

    var x255 = scale(255);

    function integerSupremum(value) {
	return Math.ceil(value);
    }

    function hexValue(value) {
	var hex = (integerSupremum(x255(value))).toString(16);
	return hex.length == 1 ? '0' + hex: hex;
    }

    function toRgb(fraction) {
	hex = hexValue(fraction);
	return '#' + hex  +  hex + hex;
    }

    var Listener = function(){
	this.listeners = [];
    }
    Listener.prototype.addListener = function(listener){
	this.listeners.push(listener);
    }
    Listener.prototype.notifyAll = function(){
	this.listeners.forEach(this.notify.bind(this));
    }
    Listener.prototype.notify = function(listener){
	listener.call(null, this);
    }

    var Vision = function() {
	Listener.call(this);
	this.data = [ 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0 ];
    }
    Vision.prototype = new Listener();
    Vision.prototype.colorData = function(){
	return this.data.map(toRgb);
    }

    var VisionView = function(canvas, model){
	this.context = canvas.getContext('2d');
	this.width = canvas.width;
	this.height = canvas.height;
	this.model = model;
	this.model.addListener(this.update.bind(this));
	this.update();
    }
    VisionView.prototype.update = function(){
	var context = this.context;
	context.fillStyle = 'black';
	context.fillRect(0, 0, this.width, this.height);

	var colorData = this.model.colorData();
	var offset = (this.width - colorData.length) / 2;
	colorData.forEach(function(color, index){
	    context.strokeStyle = color;
	    context.beginPath();
	    context.moveTo(offset + index, 0);
	    context.lineTo(offset + index, this.height);
	    context.stroke();
	}.bind(this));

    }

    var canvas = document.getElementById('vision');

    var vision = new Vision();
    new VisionView(canvas, vision);
})();
