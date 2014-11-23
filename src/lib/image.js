var fs = require('fs'),
  getPixels = require('get-pixels'),
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

  // cb = generic callback object, first parameter is an error
  Printer.prototype.printImage = function(path, cb){
    getPixels(path, function(err, pixels){
      if(!err){
        var width = pixels.shape[0];
        var height = pixels.shape[1];

        if (width != 384 || height > 65635) {
          return cb(new Error('Image width must be 384px, height cannot exceed 65635px.'));
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

      } else {
        return cb(new Error(err));
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