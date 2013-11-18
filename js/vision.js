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

    var Radar = function(x, y, heading, radius, halfAngle){
	Listener.call(this);
	this.x = x;
	this.y = y;
	this.heading = heading;
	this.radius = radius;
	this.halfAngle = halfAngle;
	this.delta = Math.PI/50;
    }
    Radar.prototype = new Listener();
    Radar.prototype.left = function(){
	this.heading -= this.delta;
	this.notifyAll();
    }
    Radar.prototype.right = function(){
	this.heading += this.delta;
	this.notifyAll();
    }

    var RadarView = function(canvas, model){
	this.context = canvas.getContext('2d');
	this.width = canvas.width;
	this.height = canvas.height;
	this.model = model;
    }
    RadarView.prototype.update = function(){
	var context = this.context;
	var heading = this.model.heading;
	var halfAngle = this.model.halfAngle;
	var radius = this.model.radius;
	var x0 = this.model.x;
	var y0 = this.model.y;
	var x1 = radius * Math.cos(heading + -halfAngle) + x0;
	var y1 = radius * Math.sin(heading + -halfAngle) + y0;
	context.strokeStyle = 'red';
	context.beginPath();
	context.moveTo(x0, y0);
	context.lineTo(x1, y1);
	context.arc(x0, y0, radius, heading - halfAngle, heading + halfAngle);
	context.closePath();
	context.stroke();
    }

    var BackgroundView = function(canvas){
	this.context = canvas.getContext('2d');
	this.width = canvas.width;
	this.height = canvas.height;
    }
    BackgroundView.prototype.update = function(){
	var context = this.context;
	context.fillStyle = 'black';
	context.fillRect(0, 0, this.width, this.height);
    }

    var Game = function(radar){
	Listener.call(this);
	this.radar = radar;
	this.radar.addListener(this.notifyAll.bind(this));
    }
    Game.prototype = new Listener();

    var GameView = function(canvas, model){
	this.views = [];
	this.canvas = canvas;
	this.model = model;
	this.model.addListener(this.update.bind(this));
	this.initialize();
	this.update();
    }
    GameView.prototype.initialize = function(){
	this.views.push(new BackgroundView(this.canvas));
	this.views.push(new RadarView(this.canvas, this.model.radar));
    }
    GameView.prototype.update = function(){
	this.views.forEach(function(view){
	    view.update();
	});
    }

    var visionCanvas = document.getElementById('vision');
    var topCanvas = document.getElementById('top');

    var vision = new Vision();
    new VisionView(visionCanvas, vision);

    var radar = new Radar(topCanvas.width/2, topCanvas.height/2, -Math.PI/6, Math.min(topCanvas.width/2, topCanvas.height/2) - 10, Math.PI/3);

    var game = new Game(radar);
    new GameView(topCanvas, game);

    var body = document.getElementsByTagName('body')[0];
    body.addEventListener('keydown', function(event){
	if (event.keyCode == 37) { // left
	    radar.left();
	}
	if (event.keyCode == 38) { // up
	    console.log(event);
	}
	if (event.keyCode == 39) { // right
	    radar.right();
	}
	if (event.keyCode == 40) { // down
	    console.log(event);
	}
    });
})();
