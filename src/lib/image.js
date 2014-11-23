var fs = require('fs'),
  getPixels = require('get-pixels'),
  ndarray = require('ndarray'),
  ndarrayOps = require('ndarray-ops'),
  helpers = require('./helpers');

module.exports = function(Printer){

  // Simple debugfunction to output
  var debugImageData = function(imgData){
    for (y = 0; y < imgData.length; y++) {
      for (x = 0; x < imgData[y].length; x++) {

        for (var bitMask = 1; bitMask < 256; bitMask <<= 1) {
          if((bitMask & imgData[y][x]) === bitMask ){
            process.stdout.write("1");
          } else {
            process.stdout.write(" ");
          };
        }
      }
      process.stdout.write("\n");
    }
  }

  // Make an empty white image
  var createWhiteImage = function(w,h){
    var shape = [w,h,4];

    var result = ndarray(new Uint8Array(shape[0] * shape[1] * shape[2]), shape);

    ndarrayOps.assigns(result, 255);

    return result;
  }

  // cb = generic callback object, first parameter is an error
  // position = "left", "center", "right" default = "center"
  Printer.prototype.printImage = function(path, position, cb){
    if(arguments.length == 2){
      cb = arguments[1];
      position = "center";
    }

    getPixels(path, function(err, pixels){
      if(err && cb){
        return cb(new Error(err));
      }

      var width = pixels.shape[0];
      var height = pixels.shape[1];

      if (width > 384 || height > 65635) {
        return cb(new Error('Image width must not exceed 384px, height cannot exceed 65635px.'));
      }

      if (width < 384){
        var white = createWhiteImage(384, height);
        var dx;
        if(position == "left"){
          dx = 0;
        } else if (position == "right"){
          dx = white.shape[0] - pixels.shape[0];
        } else {
          dx = Math.floor((white.shape[0] - pixels.shape[0])/2);
        }
        var cutout = white.lo(dx,0).hi(pixels.shape[0], pixels.shape[1]);
        ops.assign(cutout, pixels);

        // Reassign pixels
        pixels = cutout
        width = pixels.shape[0];
      }

      // contruct an array of Uint8Array,
      // each Uint8Array contains 384/8 pixel samples, corresponding to a whole line
      var imgData = [];
      for (var y = 0; y < height; y++) {
        imgData[y] = new Uint8Array(width/8);
        for (var x = 0; x < (width/8); x++) {
          imgData[y][x] = 0;
          for (var n = 0; n < 8; n++) {
            var r = pixels.get(x*8+n, y, 0);
            var g = pixels.get(x*8+n, y, 1);
            var b = pixels.get(x*8+n, y, 2);

            var brightness = helpers.rgbToHsl(r, g, b)[2];
            // only print dark stuff
            if (brightness < 0.6) {
              imgData[y][x] += (1 << n);
            }
          }
        }
      }

      // send the commands and buffers to the printer
      this.printImageData(width, height, imgData);

      if(cb){
        return cb(null);
      }
    }.bind(this))
  }

  Printer.prototype.printImageData =function(width, height, imgData){
    if (width != 384 || height > 65635) {
      throw new Error('Image width must be 384px, height cannot exceed 65635px.');
    }


    // send the commands and buffers to the printer
    var commands = [18, 118, height & 255, height >> 8];
    for (y = 0; y < imgData.length; y++) {
      var buf = helpers.uint8ArrayToBuffer(imgData[y]);
      commands.push.apply(commands, buf);
    }
    this.writeCommands(commands);
    return this;
  }


}