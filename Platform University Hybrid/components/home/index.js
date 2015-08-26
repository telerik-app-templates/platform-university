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
        successHandler = function(data) {
            var redirect = mode === 'signin' ? signinRedirect : registerRedirect;
            
            if (data && data.result) {                            
                provider.Users.currentUser().then(
                function (user) {
                    app.currentUser = user.result;
                    var role = user.result.Role;
                    var url = "https://platform.telerik.com/bs-api/v1/oixi02nRsPmqNOS7/Functions/GetRole?roleId=" + role;

                    $.get(url, 
                         function (success) {
                         app.mobileApp.navigate('components/' + success + 'View/view.html');
                    });

                }, function (error) {
                    console.log(error);
                });
            }
/*            return;
            if (data && data.result) {
                app.user = data.result;

                setTimeout(function() {
                    app.mobileApp.navigate('components/' + redirect + '/view.html');
                }, 0);
            } else {
                init();
            }*/
        },
        homeModel = kendo.observable({
            displayName: '',
            email: 'hutnick@progress.com',
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
        //provider.Users.currentUser().then(successHandler, init);
    });
})(app.home);

// START_CUSTOM_CODE_homeModel
// END_CUSTOM_CODE_homeModel