define(function(require, exports, module) {
	"use strict";	

	var 
		$ = require('jquery'),

		Controller = require('./Controller')

		;

	
	var AppController = Controller.extend({

		"init": function() {

			this._super($("body"));

			// Routing
			if (!this.routes) {
				this.routes = [];
			}
			this.routingEnabled = false;
			$(window).bind('hashchange', $.proxy(this.route, this));
			$(window).bind('load', function() {
				// console.log("====> onload");
			});

		},

		"setupRoute": function(match, func) {
			if (!this.routes) {this.routes = [];}
			this.routes.push([match, func]);
		},

		"route": function(enable) {
			
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

			var parameters;

			for(var i = 0; i < this.routes.length; i++) {
				parameters = hash.match(this.routes[i][0]);
				if (parameters) {
					// console.log("Found a route match on ", this.routes[i], parameters);
					if (typeof this[this.routes[i][1]] === 'function') {
						var args = Array.prototype.slice.call(parameters, 1);
						this[this.routes[i][1]].apply(this, args);
					}
					return;
				} 

			}

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
