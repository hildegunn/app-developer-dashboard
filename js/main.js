
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
		"jquery"	: "/bower_components/jquery/dist/jquery.min"
	},
	shim: {
		"dust": {
			"exports": "dust"
		}
	}
});




function buildUrl(url, parameters){
	var qs = "";
	for(var key in parameters) {
		var value = parameters[key];
		qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
	}
	if (qs.length > 0){
	    qs = qs.substring(0, qs.length-1); //chop off last "&"
	    url = url + "?" + qs;
	}
	return url;
}



define(function(require, exports, module) {

	var 
		$ = require('jquery'),
		App = require('lib/App');

	$(document).ready(function() {
		var app = new App();
	});

});



