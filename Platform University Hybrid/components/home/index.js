'use strict';

app.home = kendo.observable({
    onShow: function() {},
    afterShow: function() {}
});

// START_CUSTOM_CODE_home
// END_CUSTOM_CODE_home
(function(parent) {
    var provider = app.data.defaultProvider,
        mode = 'signin',
        registerRedirect = 'home',
        signinRedirect = 'home',
        facultyUrl = 'https://platform.telerik.com/bs-api/v1/oixi02nRsPmqNOS7/Functions/GetProfessors',
        init = function(error) {
            if (error) {
                if (error.message) {
                    alert(error.message);
                }

                return false;
            }

            var activeView = mode === 'signin' ? '.signin-view' : '.signup-view';

            if (provider.setup && provider.setup.offlineStorage && !app.isOnline()) {
                $('.offline').show().siblings().hide();
            } else {
                $(activeView).show().siblings().hide();
            }
        },
        getAppData = function() {
            // get updated professor list, store in app
            var prof = $.get(facultyUrl,
                            function (success) {
                app.professors = success.result;
            }).fail(function () {
                app.professors = [];
            });
            
            // get updated grade types list, store in app
            var grades = provider.data('GradeType');
            grades.get(null)
            .then(function (success) {
                app.gradeTypes = success.result;
            }, function (error) {
                app.gradeTypes = [];
            });
        },
        successHandler = function(data) {
            var redirect = mode === 'signin' ? signinRedirect : registerRedirect;
            
            if (data && data.result) {                            
                provider.Users.currentUser().then(
                function (user) {
                    app.currentUser = user.result;
                    var role = user.result.Role;
                    var url = "https://platform.telerik.com/bs-api/v1/oixi02nRsPmqNOS7/Functions/GetRole?roleId=" + role;
                    
                    getAppData();
                    
                    $.get(url, 
                         function (success) {
                         app.mobileApp.navigate('components/' + success + 'View/view.html');
                    });

                }, function (error) {
                    console.log(error);
                });
            }
        },
        homeModel = kendo.observable({
            displayName: '',
            email: 'hutnick@progress.com',	//@progress.com = student, @telerik.com = faculty
            password: 'demo',
            homeShow: function (e) {
                if ($("#title-image").attr("src") === undefined) {
                    var width = e.view.element[0].scrollWidth;
                    var base = "https://bs1.cdn.telerik.com/image/v1/oixi02nRsPmqNOS7/resize=w:" + width;
                    var src = "/https://bs3.cdn.telerik.com/v1/oixi02nRsPmqNOS7/17868110-526a-11e5-8d13-31a9a0f6f87f";
                    $("#title-image").attr("src", base + src);
                }
            },
            validateData: function(data) {
                if (!data.email) {
                    alert('Missing email');
                    return false;
                }

                if (!data.password) {
                    alert('Missing password');
                    return false;
                }

                return true;
            },
            signin: function() {
                var model = homeModel,
                    email = model.email.toLowerCase(),
                    password = model.password;

                if (!model.validateData(model)) {
                    return false;
                }

                provider.Users.login(email, password, successHandler, init);
            },
            register: function() {
                var model = homeModel,
                    email = model.email.toLowerCase(),
                    password = model.password,
                    displayName = model.displayName,
                    attrs = {
                        Email: email,
                        DisplayName: displayName
                    };

                if (!model.validateData(model)) {
                    return false;
                }

                provider.Users.register(email, password, attrs, successHandler, init);
            },
            toggleView: function() {
                mode = mode === 'signin' ? 'register' : 'signin';
                init();
            },
            logoutShow: function() {
                setTimeout(function() {
                    provider.Users.logout(
                        function (success) {
                            // On logout, this kills navigation history and returns to Title screen.  This way stuff like
                            // Android back button doesn't bring users back to previously viewed screens.
                            var backlen = window.history.length;
                            window.history.go(-(backlen-1));
                            window.location.replace("#components/home/view.html");
                        }, function (error) {
                            alert("Problem with logging out. Please shut down the app if this continues to login again.");
                        });
                }, 2000);
            }
        });

    parent.set('homeModel', homeModel);
    parent.set('afterShow', function() {
        app.data.defaultProvider.helpers.html.processAll();
    });
})(app.home);

// START_CUSTOM_CODE_homeModel
// END_CUSTOM_CODE_homeModel