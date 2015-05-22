"use strict";

requirejs.config({
	//By default load any module IDs from js/lib
	baseUrl: 'js',
	//except, if the module ID starts with "app",
	//load it from the js/app directory. paths
	//config is relative to the baseUrl, and
	//never includes a ".js" extension since
	//the paths config could be for a directory.
	paths: {
		"bower"     : '/bower_components',
		"text"      : '/bower_components/text/text',
		"templates" : '/templates/',
		"dust"      : '/bower_components/dustjs-linkedin/dist/dust-full.min',
		"class"     : "class",
		"jquery"	: "/bower_components/jquery/dist/jquery.min",
		"dict"		: "/dictionaries/dictionary.en.json",
		"bootstrap" : "/bower_components/bootstrap/dist/js/bootstrap.min",
		"es6-promise": "/bower_components/es6-promise/promise"
	},
	shim: {
		"dust": {
			"exports": "dust"
		},
		"bootstrap": {
			"deps": ["jquery"]
		}
	}
});


define(function(require, exports, module) {

	var 
		$ = require('jquery'),
		App = require('lib/App');

	$(document).ready(function() {
		var app = new App();
	});

});



