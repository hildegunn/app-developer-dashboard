define(function(require, exports, module) {
	"use strict";	

	var 
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine'),
		Pane = require('../Pane'),

		Dictionary = require('../../Dictionary'),
		EventEmitter = require('../../EventEmitter');

	var 
		template = require('text!templates/ServiceProviderOrgMain.html');

	var ServiceProviderOrgMain = Pane.extend({

		"init": function(mainlisting, org) {
			this._super();
			this.org = org;

			this.mainListing = mainlisting;

			this.dict = new Dictionary();
			this.template = new TemplateEngine(template, this.dict, true);

			this.initLoad();
		},

		"initLoad": function() {
			this.draw(false)
				.then(this.proxy("_initLoaded"));
		},
		
		"draw": function() {
			var that = this;

			var view = {
				organization: this.org.getView()
			};

			return that.template.render(that.el, view).then(function() {
				that.el.find('.mainlisting').append(that.mainListing.el);
			});
		}

	}).extend(EventEmitter);

	return ServiceProviderOrgMain;

});
