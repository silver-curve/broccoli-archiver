var CachingWriter = require('broccoli-caching-writer');

var fs = require('fs');
var path = require('path');
var RSVP = require('rsvp');

var archiver = require('archiver');

export default class BroccoliArchiver extends CachingWriter {

  constructor(inputNodes, options = {}) {
    super(inputNodes, options);

    this.archiveName = options.archive || "archive.zip";
    if (this.archiveName.indexOf('.') === -1) {
      this.archiveName += '.zip';
    }
  }

  build() {
    // only gets called if something has changed
    // console.log("BroccoliArchiver build "+this.annotation);
    var inputPath = this.inputPaths[0];
    var outputPath = path.join(this.outputPath, this.archiveName);
    return new RSVP.Promise(function (resolve, reject) {
      var output = fs.createWriteStream(outputPath);
      var archive = archiver('zip');
  
      output.on('close', function () {
        resolve();
      });
  
      archive.on('error', function (err) {
        reject(err);
      });
  
      // Read the directory
  
      fs.readdir(inputPath, function (err) {
        // Return the error if something went wrong
        if (err)
        {  
          reject(err);
        }
  
        archive.pipe(output);
        archive.bulk({ 
          expand: true, 
          cwd: inputPath, 
          src: ["**/**/**/*"], // no idea why this weird glob is needed
          dot:true,
          data: function (data) {
            if (data.name.endsWith('.sh') || data.name.indexOf('.') === -1)
            {
              // make scripts executable
              data.mode = 0x777;
              }
            return data;
          }
        });
        archive.finalize();
      });
    });
  }
}
