
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
		"class"     : "class"
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

		App = require('lib/App'),
		dust = require('dust');






	$(document).ready(function() {


		var app = new App();
		// app.run();


		// window.sbx = $('.searchbox').selectize({
		// 	valueField: 'profile_image_token',
		// 	labelField: 'name',
		// 	searchField: 'name',
		// 	options: [],
		// 	create: false,
		// 	render: {
		// 		option: function(item, escape) {

		// 			// console.log("About to render item ", item);
		// 			// return '<div>' + JSON.stringify(item) + '</div>';


		// 			var pimg = 'https://auth.dev.feideconnect.no/static/media/default-profile.jpg';
		// 			if (item.hasOwnProperty("profile_image_token")) {
		// 				pimg = 'http://api.dev.feideconnect.no:6543/peoplesearch/people/profilephoto/' + item.profile_image_token;
		// 			}


		// 			return  '<div class="media">' +
		// 				'<div class="media-left" style="">' +


		// 					'<img class="profileimage" ' + 
		// 						'src="' + pimg + '" alt="Profile photo" />' + 
		// 				'</div>' + 
		// 				'<div class="media-body">' +
		// 					'<h4 class="media-heading">' + escape(item.name) + '</h4>' +
		// 					'<p>UNINETT AS</p>' + 
		// 				'</div>' +
		// 			'</div>';
		// 		}
		// 	},
		// 	// score: function(search) {
		// 	// 	var score = this.getScoreFunction(search);
		// 	// 	return function(item) {
		// 	// 		return score(item) * (1 + Math.min(item.watchers / 100, 1));
		// 	// 	};
		// 	// },
		// 	load: function(query, callback) {
		// 		if (!query.length) return callback();
		// 		if (query.length < 2) return callback();

		// 		app.psSearch(query, function(data) {
		// 			console.log("Doing a callback", data);
		// 			if (!data.length) return callback();
		// 			data.sort(function(a, b) {
		// 			  if (a.name > b.name) {
		// 			    return 1;
		// 			  }
		// 			  if (a.name < b.name) {
		// 			    return -1;
		// 			  }
		// 			  // a must be equal to b
		// 			  return 0;
		// 			});
		// 			callback(data);
		// 		});

		// 	}
		// });


		// $("#searchbox"

	});

});


