/* jshint node: true */
module.exports = function(grunt) {

	"use strict";

	var cfg

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		config: grunt.file.readJSON('config.js'),
		jslint: {
			app: {
				src: ['Gruntfile.js', 'app/js/**/*.js', 'test/**/*.js'],
			}
		},
		jshint: {

			files: ['Gruntfile.js', 'app/js/**/*.js', 'test/**/*.js'],
			options: {
				jshintrc: true,
				globals: {
					jQuery: true
				}
			}
		},
		cachebreaker: {
			dev: {
				options: {
					match: ['dist/app.min.css', 'build/app.min.js']
				},
				files: {
					src: ['app/index.html']
				}
			}
		},
		shell: {
			rcss: {
				command: 'node_modules/requirejs/bin/r.js -o build.css.js'
			},
			rjs: {
				command: "" // Will be overridden below, depending on languages config.
			},
			bower: {
				command: "node_modules/bower/bin/bower --allow-root install"
			},
			version: {
				command: [
					// "git rev-parse --verify HEAD > app/etc/version-git.txt",
					"node_modules/bower/bin/bower --allow-root list -j > app/etc/bower-list.json"
				].join(' && ')
			}
		},
		watch: {
			files: ['<%= jshint.files %>'],
			tasks: ['jshint']
		},
		transifex: {
			"feide-connect": {
				options: {
					targetDir: "./dictionaries/transifex", // download specified resources / langs only
					resources: ["developer-dashboard"],
					languages: ["en_US", "fr"],
					filename: "dictionary._lang_.json"
						// templateFn: function(strings) { return strings; }  // customize the output file format (see below)
				}
			}
		}
	});


	grunt.registerTask("langbuild", "Build dictionary files based upon transifex output.", function() {
		grunt.log.writeln('Build dictionary files...');

		var mainlang = "en";
		var maindictFile = "dictionaries/transifex/dictionary." + mainlang + ".json";
		var maindict = grunt.file.readJSON(maindictFile);

		var lang, langdict, key;

		// Bokmål henter fra nb heller en englesk hvis oversettelse ikke finnes.
		//  Not yet implemented. TODO.
		var defaultOverrides = {
			"nn": "nb"
		};

		// Iterate over all languages...
		for (var i = 0; i < cfg.languages.length; i++) {
			lang = cfg.languages[i];
			if (lang === mainlang) {
				continue;
			}
			langdict = grunt.file.readJSON("dictionaries/transifex/dictionary." + lang + ".json");

			for (key in maindict) {
				if (!langdict.hasOwnProperty(key)) {

					grunt.log.writeln('Dictionary [' + lang + '] is missing translation of the term [' + key + ']. Using the [' + mainlang + '] string.');
					langdict[key] = maindict[key];
				}
			}
			langdict._lang = lang;
			grunt.file.write("dictionaries/build/dictionary." + lang + ".json", JSON.stringify(langdict, undefined, 2));

		}
		maindict._lang = mainlang;
		grunt.file.write("dictionaries/build/dictionary." + mainlang + ".json", JSON.stringify(maindict, undefined, 2));

	});



	// ---- Section on building locale based app builds.
	var shell = grunt.config.get("shell");
	cfg = grunt.config.get("config");
	var lang;
	shell.rjs.command = [];
	for (var i = 0; i < cfg.languages.length; i++) {
		lang = cfg.languages[i];
		shell.rjs.command.push("node_modules/requirejs/bin/r.js -o build.js paths.dict=../../dictionaries/build/dictionary." + lang + ".json paths.DustIntlData=../../bower_components/dust-helper-intl/dist/locale-data/" + lang + " out=app/dist/app.min.js." + lang + "");
	}
	// We comment out this, because it overrides the langauge negotiation
	// when enabled.
	// shell.rjs.command.push("cp dist/app.min.js.en dist/app.min.js");

	for (var to in cfg["language-aliases"]) {
		var tofile = "app/dist/app.min.js." + to;
		var fromfile = "app/dist/app.min.js." + cfg["language-aliases"][to];
		shell.rjs.command.push("cp " + fromfile + " " + tofile);
	}

	shell.rjs.command = shell.rjs.command.join(" && ");
	grunt.config("shell", shell);

	var transifex = grunt.config.get("transifex");
	transifex["feide-connect"].options.languages = cfg.languages;
	grunt.config.set("transifex", transifex);
	// ---- Section on building locale based app builds.

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-transifex');
	grunt.loadNpmTasks('grunt-cache-breaker');

	// Tasks
	grunt.registerTask('default', ['jshint']);
	// grunt.registerTask('jshint', ['jshint']);
	// grunt.registerTask('jslint', ['jslint']);
	grunt.registerTask('bower', ['shell:bower']);
	grunt.registerTask('build', ['shell:bower', 'jshint', 'shell:rcss', 'shell:rjs', 'shell:version', 'cachebreaker']);
	grunt.registerTask('test', ['jshint']);

	grunt.registerTask('lang', ['transifex', 'langbuild']);
};
