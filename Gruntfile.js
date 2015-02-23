module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		config: grunt.file.readJSON('etc/config.js'),
		jshint: {
			files: ['Gruntfile.js', 'js/**/*.js', 'test/**/*.js'],
			options: {
				globals: {
					jQuery: true
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
	        }
	    },
		watch: {
			files: ['<%= jshint.files %>'],
			tasks: ['jshint']
		}
	});


	// ---- Section on building locale based app builds.
	var shell = grunt.config.get("shell");
	var cfg = grunt.config.get("config");
	var lang;
	shell.rjs.command = [];
	for(var i = 0; i < cfg.languages.length; i++) {
		lang = cfg.languages[i];
		shell.rjs.command.push("node_modules/requirejs/bin/r.js -o build.js paths.dict=../dictionaries/dictionary." + lang + ".json out=dist/app.min.js." + lang + "");
	}
	shell.rjs.command.push("cp dist/app.min.js.en app.min.js");
	shell.rjs.command = shell.rjs.command.join(" && ");
	grunt.config("shell", shell);



	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-requirejs');
	grunt.loadNpmTasks('grunt-shell');
	

	// Tasks
	grunt.registerTask('default', ['jshint']);
	grunt.registerTask('bower', ['shell:bower']);
	grunt.registerTask('build', ['shell:bower', 'jshint', 'shell:rcss', 'shell:rjs']);
	grunt.registerTask('test', ['jshint']);
};