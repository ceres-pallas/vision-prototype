(function(){
    var VisionView = function(canvas){
	this.context = canvas.getContext('2d');
	this.width = canvas.width;
	this.height = canvas.height;
	this.update();
    }
    VisionView.prototype.update = function(){
	this.context.fillRect(0, 0, this.width, this.height);
    }

    var canvas = document.getElementById('vision');

    new VisionView(canvas);
})();
