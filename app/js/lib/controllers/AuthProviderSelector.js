define(function(require, exports, module) {
	"use strict";

	var
		$ = require('jquery'),
		Controller = require('./Controller'),

		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine'),
		EventEmitter = require('../EventEmitter');

	var authProviderTemplate = require('text!templates/AuthProviders.html');
	var providerTemplate = require('text!templates/partials/AuthProvider.html');
	var providerExtraTemplate = require('text!templates/partials/AuthProviderExtra.html');

	var AuthProviderSelector = Controller.extend({

		"init": function(el, feideconnect, providerdata, selectedProviders, idportenAuthorized, dict) {

			var that = this;
			this.feideconnect = feideconnect;
			this.providerdata = providerdata;
			this.selectedProviders = selectedProviders;
			this.idportenAuthorized = idportenAuthorized;

			this.template = new TemplateEngine(authProviderTemplate, dict);
			TemplateEngine.prototype.loadPartial('AuthProvider', providerTemplate);
			TemplateEngine.prototype.loadPartial('AuthProviderExtra', providerExtraTemplate);

			if (selectedProviders === null) {
				this.selectedProviders = ['all'];
			} else {
				if (selectedProviders.length === 0) {
					this.selectedProviders = ['none'];
				}
			}

			this._super(el, true);

			this.el.on("click", ".providerentry", function(e) {
				e.stopPropagation();
				var t = $(e.currentTarget);
				var t2 = $(e.target);
				if (t2.prop("tagName") === 'INPUT') {
					return;
				}

				e.preventDefault();
				var ti = t.find('input');

				if (ti.attr("disabled") === "disabled") {
					return;
				}

				ti.prop('checked', !ti.prop('checked'));

			});
			this.el.on("change", "input.selectgroup", function(e) {
				e.preventDefault();
				e.stopPropagation();
				var t = $(e.currentTarget);
				that.updateDataFromInputControls();
			});

			this.el.on("click", "button.actSaveChanges", function(e) {
				e.preventDefault();
				e.stopPropagation();
				that.updateDataFromInputControls();
				that.emit("save", that.selectedProviders);
			});

		},

		"hasItem": function(x) {
			for (var i = 0; i < this.selectedProviders.length; i++) {
				if (this.selectedProviders[i] === x) {
					return true;
				}
			}
			return false;
		},

		"updateControlsFromData": function() {

			var proplist = ["all", "feide|all", "social|all", "feide|go", "feide|he", "feide|vgs"];
			var props = {};

			for (var i = 0; i < proplist.length; i++) {
				props[proplist[i]] = this.hasItem(proplist[i]);
			}

			this.el.find('input.selectgroup').each(function(i, item) {
				var e = $(item);
				var val = e.data('val');

				if (props.hasOwnProperty(val)) {
					e.prop("checked", props[val]);
				}
			});

			this.updateDataFromInputControls();
		},

		"updateDataFromInputControls": function() {

			var providers = [];
			var key;
			var props = {};
			var listselections = {
				"idportenlist": [],
				"sociallist": [],
				"otherlist": [],
				"orglistgo": [],
				"orglistvgs": [],
				"orglisthe": []
			};

			this.el.find('input.selectgroup').each(function(i, item) {
				var e = $(item);
				var s = e.prop("checked");
				var val = e.data('val');
				props[val] = s;
			});

			// console.log("------ PROPS");
			// console.log(props);

			var xfunc = function(i, item) {
				var e = $(item);
				var ep = e.closest('.providerentry');
				// console.log("Found list entry ", key, ep.data('id'), e.prop("checked"));
				if (e.prop("checked")) {
					// console.log("Found list entry CHECKED ", key, ep.data('id'));
					listselections[key].push(ep.data('id'));
				}

			};


			for (key in listselections) {
				this.el.find('.' + key + ' .providerentry input').each(xfunc);
			}

			if (listselections.idportenlist.length > 0) {
				providers = providers.concat(listselections.idportenlist);
			}

			if (props.all) {
				providers.push('all');
				this.el.find('.pgroupall').hide();
			} else {

				this.el.find('.pgroupall').show();

				providers = providers.concat(listselections.otherlist);

				if (props['social|all']) {
					providers.push('social|all');
					this.el.find('.sociallist').hide();
				} else {
					providers = providers.concat(listselections.sociallist);
					this.el.find('.sociallist').show();
				}

				if (props['feide|all']) {
					providers.push('feide|all');

					this.el.find('.pgroupfeide').hide();

				} else {
					this.el.find('.pgroupfeide').show();

					if (props['feide|he']) {
						providers.push('feide|he');
						this.el.find('.orglisthe').hide();
					} else {
						providers = providers.concat(listselections.orglisthe);
						this.el.find('.orglisthe').show();
					}

					if (props['feide|vgs']) {
						providers.push('feide|vgs');
						this.el.find('.orglistvgs').hide();
					} else {
						providers = providers.concat(listselections.orglistvgs);
						this.el.find('.orglistvgs').show();
					}

					if (props['feide|go']) {
						providers.push('feide|go');
						this.el.find('.orglistgo').hide();
					} else {
						providers = providers.concat(listselections.orglistgo);
						this.el.find('.orglistgo').show();

					}

				}

			}

			// console.error("Data is ", providers)
			// console.error("List selections", listselections);
			if (providers.length === 0) {
				providers.push('none');
			}
			this.selectedProviders = providers;
			// $(".debug").empty().append(JSON.stringify(providers, undefined, 2));

		},


		"initLoad": function() {

			var that = this;

			return this.providerdata.onLoaded()
				.then(this.proxy("draw"))
				.then(function() {
					// that.updateDataFromInputControls();
					that.updateControlsFromData();
				})
				.then(that.proxy("_initLoaded"));

		},

		"getProviderExtraView": function(item, restricted) {
			var txt = '';
			var classes = [];
			var id = item.def.join('|');
			var active = this.hasItem(id);
			var checked = '';
			if (active) {
				classes.push('list-group-item-info');
				checked = 'checked="checked"';
			}

			var view = {
				id: id,
				classes: classes,
				checked: checked,
				restricted: restricted,
				title: item.title
			};

			// console.error("ABout to show IDporten ", restricted);

			var authbase = this.feideconnect.config.apis.auth;

			var iconImage = '';
			if (item.iconImage) {
				view.iconImage = authbase + '/static/media/disco/' + item.iconImage;
			} else if (item.icon) {
				view.icon = item.icon;
			}

			return view;

		},


		"getProviderView": function(item) {
			var classes = [];
			var id = 'feide|realm|' + item.id;
			var active = this.hasItem(id);
			var checked = '';
			if (active) {
				classes.push('list-group-item-info');
				checked = 'checked="checked"';
			}

			var orgLogo = this.feideconnect.orgLogoURL('fc:org:' + item.id);

			var view = {
				id: id,
				classes: classes.join(' '),
				checked: checked,
				orgLogo: orgLogo,
				title: item.title
			};
			return view;

		},


		"draw": function() {
			var that = this,
				i;
			var view = {
				'he': [],
				'vgs': [],
				'go': []
			};
			var item, providerView;

			this.providerdata.orgs.sort(function(a, b) {
				var xa = (that.hasItem('feide|realm|' + a.id) ? 1 : 0);
				var xb = (that.hasItem('feide|realm|' + b.id) ? 1 : 0);
				return xb - xa;
			});

			for (i = 0; i < this.providerdata.orgs.length; i++) {
				item = this.providerdata.orgs[i];
				// console.error("item", item);
				providerView = this.getProviderView(item);
				for (var j = 0; j < item.type.length; j++) {
					if (view.hasOwnProperty(item.type[j])) {
						view[item.type[j]].push(providerView);
					}
				}

			}

			view.idporten = [];
			view.other = [];
			view.social = [];

			for (i = 0; i < this.providerdata.extra.length; i++) {

				item = this.providerdata.extra[i];
				if (item.def[0] === 'idporten') {
					item.def = ['idporten'];
					providerView = this.getProviderExtraView(item, !that.idportenAuthorized);

				} else {
					providerView = this.getProviderExtraView(item, false);
				}

				view[item.def[0]].push(providerView);

			}
			this.template.render(this.el, view).then(function() {
			});;
		}



	}).extend(EventEmitter);


	return AuthProviderSelector;
});
