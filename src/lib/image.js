var fs = require('fs'),
  Canvas = require('canvas'),
  Image = Canvas.Image,
  helpers = require('./helpers');

module.exports = function(Printer){

  Printer.prototype.printImage = function(path) {
    // put the image in the canvas
    var file = fs.readFileSync(path);
    var img = new Image();
    img.src = file;
    if (img.width != 384 || img.height > 65635) {
      throw new Error('Image width must be 384px, height cannot exceed 65635px.');
    }
    var canvas = new Canvas(img.width, img.height);
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);
    var pixels = ctx.getImageData(0, 0, img.width, img.height).data;

    // contruct an array of Uint8Array,
    // each Uint8Array contains 384/8 pixel samples, corresponding to a whole line
    var imgData = [];
    for (var y = 0; y < img.height; y++) {
      imgData[y] = new Uint8Array(img.width/8);
      for (var x = 0; x < (img.width/8); x++) {
        imgData[y][x] = 0;
        for (var n = 0; n < 8; n++) {
          var pixel = ctx.getImageData(x*8+n, y, 1, 1).data;
          var brightness = helpers.rgbToHsl(pixel[0], pixel[1], pixel[2])[2];
          // only print dark stuff
          if (brightness < 0.6) {
            imgData[y][x] += (1 << n);
          }
        }
      }
    }

    // send the commands and buffers to the printer
    var commands = [18, 118, img.height & 255, img.height >> 8];
    for (y = 0; y < imgData.length; y++) {
      var buf = helpers.uint8ArrayToBuffer(imgData[y]);
      commands.push.apply(commands, buf);
    }
    this.writeCommands(commands);
    return this;
  };

}