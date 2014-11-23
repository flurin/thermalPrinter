module.exports = function(Printer){
  // Barcodes

  // Set barcodeTextPosition
  //
  // Position can be:
  // 0: Not printed
  // 1: Above the barcode
  // 2: Below the barcode
  // 3: Both above and below the barcode
  Printer.prototype.barcodeTextPosition = function(pos){
    var error;

    if(pos > 3 || pos < 0){
      throw new Error('Position must be 0, 1, 2 or 3');
    }

    var commands = [29, 72, pos];
    return this.writeCommands(commands);
  };

  // Set barcode height
  // 0 < h < 255 (default = 50)
  Printer.prototype.barcodeHeight = function(h){
    if(h > 255 || h < 0){
      throw new Error('Height must be 0 < height > 255');
    }

    var commands = [29, 104, h];
    return this.writeCommands(commands);
  };

  Printer.BARCODE_CHARSETS = {
    NUMS: function(n){ return n >= 48 && n <= 57; },
    ASCII: function(n){ return n >= 0 && n <= 127; }
  };

  // These are all valid barcode types.
  // Pass this object to printer.barcode() as type:
  //    printer.barcode(Printer.BARCODE_TYPES.UPCA, "data");
  Printer.BARCODE_TYPES = {
    UPCA : {
      code: 65,
      size: function(n){ return n == 11 || n == 12; },
      chars: Printer.BARCODE_CHARSETS.NUMS
    },
    UPCE : {
      code: 66,
      size: function(n){ return n == 11 || n == 12; },
      chars: Printer.BARCODE_CHARSETS.NUMS
    },
    EAN13 : {
      code: 67,
      size: function(n){ return n == 12 || n == 13; },
      chars: Printer.BARCODE_CHARSETS.NUMS
    },
    EAN8 : {
      code: 68,
      size: function(n){ return n == 7 || n == 8; },
      chars: Printer.BARCODE_CHARSETS.NUMS
    },
    CODE39 : {
      code: 69,
      size: function(n){ return n > 1; },
      chars: function(n){
        // " $%+-./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        return (
          n == 32 ||
          n == 36 ||
          n == 37 ||
          n == 43 ||
          (n >= 45 && n <= 57) ||
          (n >= 65 && n <= 90)
        );
       }
    },
    I25 : {
      code: 70,
      size: function(n){ return n > 1 && n % 2 === 0; },
      chars: Printer.BARCODE_CHARSETS.NUMS
    },
    CODEBAR : {
      code: 71,
      size: function(n){ return n > 1; },
      chars: function(n){
        // "$+-./0123456789:ABCD"
        return (
          n == 36 ||
          n == 43 ||
          (n >= 45 && n <= 58) ||
          (n >= 65 && n <= 68)
        );
       }
    },
    CODE93 : {
      code: 72,
      size: function(n){ return n > 1; },
      chars: Printer.BARCODE_CHARSETS.ASCII
    },
    CODE128 : {
      code: 73,
      size: function(n){ return n > 1; },
      chars: Printer.BARCODE_CHARSETS.ASCII
    },
    CODE11 : {
      code: 74,
      size: function(n){ return n > 1; },
      chars: Printer.BARCODE_CHARSETS.NUMS
    },
    MSI : {
      code: 75,
      size: function(n){ return n > 1; },
      chars: Printer.BARCODE_CHARSETS.NUMS
    }
  };

  Printer.prototype.barcode = function(type, data){
    var error;
    var commands = [29, 107];
    commands.push(type.code);
    commands.push(data.length);

    // Validate size
    if(!type.size(data.length)){
      error = new Error('Data length does not match specification for this type of barcode');
      error.name = "invalid_data_size";
      throw error;
    }

    for(var i=0; i < data.length; i++){
      var code = data.charCodeAt(i);
      if(!type.chars(code)){
        error = new Error('Character ' + code + ' is not valid for this type of barcode');
        error.name = "invalid_character";
        error.char = code;
        throw error;
      }

      commands.push(code);
    }

    return this.writeCommands(commands);
  };
}
