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

    function angle(x, y) {
	return Math.atan2(y, x);
    }

    function distance(dx, dy) {
	return Math.sqrt(dx*dx + dy*dy);
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
    Vision.prototype.load = function(data) {
	this.data = data;
	this.notifyAll();
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

    var Obstacle = function(x, y, radius){
	Listener.call(this);
	this.x = x;
	this.y = y;
	this.radius = radius;
    }
    Obstacle.prototype = new Listener();

    var ObstacleView = function(canvas, model){
	this.context = canvas.getContext('2d');
	this.model = model;
	this.model.addListener(this.update.bind(this));
	this.update();
    }
    ObstacleView.prototype.update = function(){
	var context = this.context;

	context.fillStyle = 'green';
	context.beginPath();
	context.moveTo(this.model.x, this.model.y);
	context.arc(this.model.x, this.model.y, this.model.radius, 0, 2 * Math.PI);
	context.closePath();
	context.fill();
    }

    var Game = function(radar, vision){
	Listener.call(this);
	this.obstacles = [];
	this.radar = radar;
	this.vision = vision;
	this.radar.addListener(this.determineVision.bind(this));
	this.determineVision();
    }
    Game.prototype = new Listener();
    Game.prototype.addObstacle = function(obstacle){
	this.obstacles.push(obstacle);
	this.determineVision();
	this.notifyAll();
    }
    Game.prototype.determineVision = function(){
	var visibles = [function(){return 0.0}];
	var radar = this.radar;
	this.obstacles.forEach(function(obstacle){
	    var d = distance(obstacle.x - radar.x, obstacle.y - radar.y);
	    var alpha = angle(obstacle.x - radar.x, obstacle.y - radar.y) - radar.heading;
	    if (- radar.halfAngle <= alpha && alpha <= radar.halfAngle && d <= radar.radius) {
		var dalpha = Math.atan(obstacle.radius/d);
		visibles.push(function(angle){
		    if (alpha - dalpha <= angle && angle <= alpha + dalpha) {
			return 1 - d/radar.radius;
		    }
		    return 0.0;
		});
	    }
	});
	var angles = [];
	var step = Math.PI/180;
	for (var beta = -radar.halfAngle; beta < radar.halfAngle; beta += step) {
	    angles.push(beta);
	}
	var data = angles.map(function(zeta){
	    return Math.max.apply(null, visibles.map(function(f){ return f(zeta) }));
	});
	vision.load(data);
    }

    var GameView = function(canvas, model){
	this.views = [];
	this.canvas = canvas;
	this.model = model;
	this.model.radar.addListener(this.update.bind(this));
	this.model.addListener(this.initialize.bind(this));
	this.initialize();
	this.update();
    }
    GameView.prototype.initialize = function(){
	this.views = [];
	this.views.push(new BackgroundView(this.canvas));
	this.model.obstacles.forEach(function(obstacle, index){
	    this.views.push(new ObstacleView(this.canvas, obstacle));
	}.bind(this));
	this.views.push(new RadarView(this.canvas, this.model.radar));
    }
    GameView.prototype.update = function(){
	this.views.forEach(function(view){
	    view.update();
	});
    }

    var visionCanvas = document.getElementById('vision');
    var vision = new Vision();
    new VisionView(visionCanvas, vision);

    var topCanvas = document.getElementById('top');

    var x = topCanvas.width/2;
    var y = topCanvas.height/2

    var radar = new Radar(x, y, -Math.PI/6, Math.min(topCanvas.width/2, topCanvas.height/2) - 10, Math.PI/3);

    var game = new Game(radar, vision);
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

    topCanvas.addEventListener('click', function(event){
	var target = event.target;
	game.addObstacle(new Obstacle(event.clientX - target.offsetLeft, event.clientY - target.offsetTop, 5));
    });
})();
