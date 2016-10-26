define(function(require, exports, module) {
	"use strict";

	var
		$ = require('jquery'),
		Controller = require('./Controller'),

		EventEmitter = require('../EventEmitter'),
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine');

	var template = require('text!templates/AppSelector.html');

	var AppSelector = Controller.extend({

		"init": function(el) {

			var that = this;
			this.apps = [];
			this.currentAppID = null;

			this._super(el);

			this.tmp = new TemplateEngine(template);

			this.ebind("click", ".appSelector a", "actSelect");

		},

		"initLoad": function() {
			this.draw()
				.then(this.proxy("_initLoaded"));
		},

		"addApp": function(app, index) {
			if (typeof index === typeof 0) {
				this.apps.splice(index, 0, app);
			} else {
				this.apps.push(app);
			}

			return this.draw()
				.catch(function(err) {
					console.error("err", err);
				});
		},

		"getCurrentApp": function() {
			return this.currentAppID;
		},

		"setApp": function(appid, notify) {

			notify = (notify !== false);

			if (this.currentAppID !== appid) {
				this.currentAppID = appid;
				if (notify) {
					this.emit("appSelected", appid);
				}
			}
			this.draw();

		},

		"actSelect": function(e) {
			e.preventDefault();

			var ct = $(e.currentTarget);
			var appid = ct.closest("li").data("appid");

			this.setApp(appid, true);

		},

		"draw": function() {
			var view = {
				"apps": []
			};

			for (var i = 0; i < this.apps.length; ++i) {
				var v = {};
				v.id = this.apps[i].getID();
				v.title = this.apps[i].getTitle();
				v.classes = [];
				if (v.id === this.currentAppID) {
					v.classes = 'active';
				}
				v.icon = this.apps[i].getSelectorIcon();
				view.apps.push(v);
			}

			return this.tmp.render(this.el.empty(), view);
		}



	}).extend(EventEmitter);


	return AppSelector;
});
