var Plugin = require('broccoli-caching-writer');

var fs = require('fs');
var path = require('path');
var RSVP = require('rsvp');

var archiver = require('archiver');

// Create a subclass BroccoliArchiver derived from Plugin
BroccoliArchiver.prototype = Object.create(Plugin.prototype);
BroccoliArchiver.prototype.constructor = BroccoliArchiver;

function BroccoliArchiver(inputNodes, options) {
  options = options || {};

//	options.cacheInclude = [/.*/];
//	options.inputFiles = ['**/**/**/*'];

//  if (!(this instanceof BroccoliArchiver)) { return new BroccoliArchiver(inputTrees, options); }
  
	this.inputNodes = Array.isArray(inputNodes) ? inputNodes : [inputNodes];

	Plugin.call(this, this.inputNodes, {
		annotation: options.annotation
	  }); //options);

	options.archive = options.archive || "archive.zip";
	if (options.archive.indexOf('.') === -1) {
		options.archive += '.zip';
	}

  this.options = options;
}

BroccoliArchiver.prototype.build = function() {
	console.log("BroccoliArchiver.prototype.build");
	var inputPath = this.inputPaths[0];
	var outputPath = path.join(this.outputPath, this.options.archive);
	return new RSVP.Promise(function (resolve, reject) {
		var output = fs.createWriteStream(outputPath);
		var archive = archiver('zip');

		output.on('close', function () {
			resolve();
		});

		archive.on('error', function (err) {
			reject(err);
		});

		var files = [];
		// Read the directory

		fs.readdir(inputPath, function (err, list) {
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
};

module.exports = BroccoliArchiver;