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
		// uglify: {
		// 	options: {
		// 		banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
		// 	},
		// 	build: {
		// 		src: 'src/<%= pkg.name %>.js',
		// 		dest: 'build/<%= pkg.name %>.min.js'
		// 	}
		// },
		watch: {
			files: ['<%= jshint.files %>'],
			tasks: ['jshint']
		},
		requirejs: {
			compile: {
				options: {
					baseUrl: "js",
					mainConfigFile: "build.js",
					paths: {
						"bower"     : '../bower_components',
						"text"      : '../bower_components/text/text',
						"templates" : '../templates/',
						"dust"      : '../bower_components/dustjs-linkedin/dist/dust-full.min',
						"class"     : "lib/class",
					},
					shim: {
						"dust": {
							"exports": "dust"
						}
					},
					name: "../bower_components/almond/almond",
					include: "main-dev",
					out: "dist/app.min.js"
				}
			}
		}
		// requirejs: {
		// 	compile: {
		// 		options: {
		// 			almond: true,
		// 			// dir: 'build',
		// 			// appDir: '.',
		// 			baseUrl: 'js',
		// 			name: "main-dev",
		// 			out: "build/app.min.js",
		// 			// include: ['main-dev'],
		// 			optimize: "none",
		// 			paths: {
		// 				"bower"     : '../bower_components',
		// 				"text"      : '../bower_components/text/text',
		// 				"templates" : '../templates/',
		// 				"dust"      : '../bower_components/dustjs-linkedin/dist/dust-full.min',
		// 				"class"     : "class"
		// 			},
		// 			wrap: {
		// 				startFile: 'etc/start.frag',
		// 				endFile: 'etc/end.frag'
		// 			},
		// 			preserveLicenseComments: false
		// 		}
		// 	}
		// }
	});


	// Load the plugin that provides the "uglify" task.
	// grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-requirejs');
	

	// Default task(s).
	grunt.registerTask('default', ['jshint']);
	grunt.registerTask('build', ['requirejs']);

};