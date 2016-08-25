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
		"bower": '/bower_components',
		"text": '/bower_components/text/text',
		"templates": '/templates/',
		"DustIntl": '/bower_components/dust-helper-intl/dist/dust-intl',
		"DustIntlData": '/bower_components/dust-helper-intl/dist/locale-data/nb',
		"dust": '/bower_components/dustjs-linkedin/dist/dust-full.min',
		"class": "class",
		"jquery": "/bower_components/jquery/dist/jquery.min",
		"dict": "/dictionaries/dictionary.en.json",
		"bootstrap-datepicker": "/bower_components/bootstrap-datepicker/dist/js/bootstrap-datepicker.min",
		"bootstrap": "/bower_components/bootstrap/dist/js/bootstrap.min",
		"es6-promise": "/bower_components/es6-promise/promise",
		"selectize": "/bower_components/selectize/dist/js/standalone/selectize",
		"flot": "/bower_components/flot/jquery.flot.time"
	},
	shim: {
		"DustIntl": {
			"deps": ["dust"],
			"exports": "DustIntl"
		},
		"DustIntlData": {
			"deps": ["DustIntl"]
		},
		"bootstrap": {
			"deps": ["jquery"]
		},
		"bootstrap-datepicker": {
			"deps": ["jquery", "bootstrap"]
		},
		"selectize": {
			"deps": ["jquery"]	
		},
		"flot": {
			"deps": ["jquery", "/bower_components/flot/jquery.flot.js"]
		}
	}
});

define.amd.dust = true;
// Configure 
if (!window.console) {
	window.console = {
		"log": function() {},
		"error": function() {},
	}
}

define(function(require, exports, module) {

	var
		$ = require('jquery'),
		App = require('lib/App');

	$(document).ready(function() {
		var app = new App();
	});

});