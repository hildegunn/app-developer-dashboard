module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
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
				command: 'r.js -o build.css.js'
	        },
	        rjs: {
				command: 'r.js -o build.js'
	        },
	        bower: {
	        	command: "bower --allow-root install"
	        }
	    },
		watch: {
			files: ['<%= jshint.files %>'],
			tasks: ['jshint']
		}
	});


	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-requirejs');
	grunt.loadNpmTasks('grunt-shell');
	

	// Tasks
	grunt.registerTask('default', ['jshint']);
	grunt.registerTask('buildx', ['requirejs']);
	grunt.registerTask('bower', ['shell:bower']);
	grunt.registerTask('build', ['shell:bower', 'shell:rcss', 'shell:rjs']);

};