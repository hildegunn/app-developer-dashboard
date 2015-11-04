define(function(require, exports, module) {
    "use strict";

    var
        $ = require('jquery'),
        Controller = require('./Controller'),
        EventEmitter = require('../EventEmitter'),
        TemplateEngine = require('../TemplateEngine'),
        Cookies = require('bower/js-cookie/src/js.cookie');

    var template = require('text!templates/languages.html');

    var LanguageController = Controller.extend({

        "init": function(app) {
            this.app = app;
            this.tmp = new TemplateEngine(template, this.app.dict);

            this.languages = [
                {
                    "title": "Norsk bokmål",
                    "code": "nb"
                },
                {
                    "title": "Norsk nynorsk",
                    "code": "nn"
                },
                {
                    "title": "English",
                    "code": "en"
                }
            ];

            this.currentTitle = 'English';
            this.selected = this.app.dict.getItem("_lang") || 'en';
            for(var i = 0; i < this.languages.length; i++) {
                this.languages[i].selected = (this.languages[i].code === this.selected);
                if (this.languages[i].selected) {
                    this.currentTitle = this.languages[i].title;
                }
            }



            var el = $('<li class="dropdown pull-right " style=""></li>');
            this._super(el, true);



            this.ebind("click", ".languageoption", "actLangSelection");
        },

        "initLoad": function() {
            return this.draw();
        },

        "draw": function(items) {
            var view = {
                "languages": this.languages,
                "current": this.currentTitle
            };
            // console.error("VIew", view, this.selected);
            this.tmp.render(this.el.empty(), view);
            this.show();
        },

        "hide": function() {
            this.el.hide();
        },

        "show": function() {
            this.el.show();
        },

        "actLangSelection": function(e) {
            e.preventDefault(); e.stopPropagation();
            var lang = $(e.currentTarget).data("lang");
            // console.error("!");
            if (lang !== this.selected) {
                // console.error("Selected Language", lang);
                this.setLang(lang);
            }
        },
        "setLang": function(lang) {
            var opts = {
                "expires": 3650
            };
            if (this.app.config.hasOwnProperty("cookiedomain") && this.app.config.cookiedomain !== null) {
                opts.domain = this.app.config.cookiedomain;
            }
            console.error("opts", opts);
            Cookies.set('lang', lang, opts);
            location.reload();
        }


    }).extend(EventEmitter);
    return LanguageController;
});