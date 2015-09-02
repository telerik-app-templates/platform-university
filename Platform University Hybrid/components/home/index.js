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
        studentRedirect = 'studentView',
        facultyRedirect = 'facultyView',
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
                console.log("success, got professors");
                app.professors = success.result;
            }).fail(function () {
                console.log("silent fail, no professor list");
                app.professors = [];
            });
            
            // get updated grade types list, store in app
            var grades = provider.data('GradeType');
            grades.get(null)
            .then(function (success) {
                app.gradeTypes = success.result;
                console.log(app.gradeTypes);
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
            email: 'hutnick@telerik.com',
            password: 'demo',
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
                            app.mobileApp.navigate('#home');
                        }, function (error) {
                            alert("Problem with logging out. Please shut down the app if this continues to login again.");
                        });
                }, 2000);
            }
        });

    parent.set('homeModel', homeModel);
    parent.set('afterShow', function() {
    });
})(app.home);

// START_CUSTOM_CODE_homeModel
// END_CUSTOM_CODE_homeModel