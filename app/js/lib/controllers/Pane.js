define(function(require, exports, module) {
	"use strict";	

	var 
		utils = require('../utils'),
		Controller = require('./Controller')
		;


	/*
	 * This controller controls 
	 */
	var Pane = Controller.extend({
		"init": function(el, load) {
			this.identifier = utils.guid();
			this.panecontroller = null;
			this._super(el, load);

			// Routing
			if (!this.routes) {
				this.routes = [];
			}

			this.el.addClass('pane');
			this.el.data('paneID', this.identifier);
		},

		"registerPaneController": function(pc) {
			this.panecontroller = pc;
		},

		"activate": function() {
			// console.log("ACTIVATE PANE");
			if (this.panecontroller === null) {throw new Error('Cannot activate pane that is not added to a controller');}
			this.panecontroller.activate(this.identifier);
		},

		"deactivate": function() {
			// console.log("Deactivating pane with identifier " + this.identifier);
			// TODO trigger an event.
		},

		"setupRoute": function(match, func) {
			if (!this.routes) {this.routes = [];}
			this.routes.push([match, func]);
		},

		"route": function(path) {
			var parameters;

			for(var i = 0; i < this.routes.length; i++) {
				parameters = path.match(this.routes[i][0]);
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

		"getSelectorIcon": function() {
			return 'fa fa-circle-o';
		},

		"getID": function() {
			throw new Error("Unimplemented");
		},

		"getTitle": function() {
			throw new Error("Unimplemented");
		}

	});

	return Pane;

});
