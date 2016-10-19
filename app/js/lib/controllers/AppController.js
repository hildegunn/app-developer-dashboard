define(function(require, exports, module) {
	"use strict";	

	var 
		$ = require('jquery'),

		Pane = require('./Pane')

		;

	
	var AppController = Pane.extend({

		"init": function() {

			this._super($("body"));

			this.routingEnabled = false;
			$(window).bind('hashchange', $.proxy(this.loadRoute, this));
		},

		"loadRoute": function(enable) {
			
			if (enable === true) {
				this.routingEnabled = true;
			}

			if (!this.routingEnabled) {return;}

			var hash = window.location.hash;
			
			if (hash.length < 3) {
				this.setHash('/');
				hash = window.location.hash;
			}
			hash = hash.substr(2);

			this.route(hash);

		},

		"setHash": function(hash) {

			this.routingEnabled = false;
			var that = this;

			window.location.hash = '#!' + hash;

			setTimeout(function() {
				that.routingEnabled = true;
			}, 0);
		}

	});

	return AppController;
});
