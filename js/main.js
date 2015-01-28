
requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: 'js',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        bower: '../../bower_components'
    }
});


define(function(require, exports, module) {

    var 
        JSO = require('bower/jso/build/jso');

    JSO.enablejQuery($);

    $(document).ready(function() {

        var jso = new JSO('google', {
            client_id: "541950296471.apps.googleusercontent.com",
            redirect_uri: "http://bridge.uninett.no/jso/index.html",
            authorization: "https://accounts.google.com/o/oauth2/auth"
        });

        jso.callback();

        jso.ajax({
            url: "https://www.googleapis.com/oauth2/v1/userinfo",
            oauth: {
                scopes: {
                    request: ["https://www.googleapis.com/auth/userinfo.email"],
                    require: ["https://www.googleapis.com/auth/userinfo.email"]
                }
            },
            dataType: 'json',
            success: function(data) {
                console.log("Response (google):");
                console.log(data);
                $(".loader-hideOnLoad").hide();
            }
        });


    });
});


