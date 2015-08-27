'use strict';

app.studentView = kendo.observable({

});

// START_CUSTOM_CODE_studentView
// END_CUSTOM_CODE_studentView
(function(parent) {
    var dataProvider = app.data.defaultProvider,
        flattenLocationProperties = function(dataItem) {
            var propName, propValue,
                isLocation = function(value) {
                    return propValue && typeof propValue === 'object' &&
                        propValue.longitude && propValue.latitude;
                };

            for (propName in dataItem) {
                if (dataItem.hasOwnProperty(propName)) {
                    propValue = dataItem[propName];
                    if (isLocation(propValue)) {
                        // Location type property
                        dataItem[propName] =
                            kendo.format('Latitude: {0}, Longitude: {1}',
                                propValue.latitude, propValue.longitude);
                    }
                }
            }
        },
        enrolledClassesUrl = "https://platform.telerik.com/bs-api/v1/oixi02nRsPmqNOS7/Functions/GetEnrolledClasses?s=",
        enrollInClassUrl = "https://platform.telerik.com/bs-api/v1/oixi02nRsPmqNOS7/Functions/EnrollStudent?s=",
        dropClassUrl = "https://platform.telerik.com/bs-api/v1/oixi02nRsPmqNOS7/Functions/DropCourse?s=",
        dataSourceOptions = {
            type: 'everlive',
            transport: {
                typeName: 'Course',
                dataProvider: dataProvider
            },

            change: function(e) {
                var data = this.data();
                for (var i = 0; i < data.length; i++) {
                    var dataItem = data[i];
                    flattenLocationProperties(dataItem);
                }
            },
            schema: {
                model: {
                    fields: {
                        'Title': {
                            field: 'Title',
                            defaultValue: ''
                        },
                        'CourseDescription': {
                            field: 'CourseDescription',
                            defaultValue: ''
                        },
                        'Enrollment': {
                            field: 'Enrollment',
                            defaultValue: []
                        }
                    }
                }
            },
        },
        dataSource = new kendo.data.DataSource(dataSourceOptions),
        studentViewModel = kendo.observable({
            dataSource: dataSource,
            studentShow: function(e) {
                $("#no-course-view").hide();
                $("#enrolled-course-list").show();

                var url = enrolledClassesUrl + app.currentUser.Id;
                var req = $.get(url,
                    function (success) {
                    $("#enrolled-courses-list").data("kendoMobileListView").setDataSource(new kendo.data.DataSource({
                        data: success
                    }));
                }).fail(function() {
                    alert("Error loading data. Check with admins!");
                });
            },
            navSource: null,
            itemClick: function(e) {
                studentViewModel.set('currentItem', e.dataItem);
                app.mobileApp.navigate('#components/studentView/details.html?src=enrolled');
            },
            courseClick: function(e) {
                studentViewModel.set('currentItem', e.dataItem);
                app.mobileApp.navigate('#components/studentView/details.html?src=courselist');
            },
            detailsShow: function(e) {
                // default, hide everything, only show what is relevant
                $("#enroll-div").hide();
                $("#drop-class-div").hide();
                $("#grades-div").hide();
                $("#class-full-div").hide();
                
                var source = e.view.params.src;
                
                if (source === "enrolled") {
                    $("#drop-class-div").show();
                    $("#grades-div").show();
                } 
                
                if (source === "courselist") {
                    if (studentViewModel.currentItem.Enrollment !== undefined) {
                        if ($.inArray(app.currentUser.Id, studentViewModel.currentItem.Enrollment) > -1) {
                            // > -1 => student is in array, so show drop div
                            $("#drop-class-div").show();
                        } else {
                            // id not found
                            // if class is not full, student may enroll
                            if (studentViewModel.currentItem.Enrollment.length >= studentViewModel.currentItem.EnrollmentCap) {
                                // class full
                                $("#class-full-div").show();
                            } else {
                                $("#enroll-div").show();
                            }
                        }
                    } else {
                        // undefined => no enrollment yet, so student can enroll
                        $("#enroll-div").show();
                    }
                }
            },
            currentItem: null,
            courseListShow: function(e) {
                console.log(studentViewModel.dataSource.view());
            },
            enrollUser: function(e) {
                app.mobileApp.showLoading();
                var url = enrollInClassUrl + app.currentUser.Id + "&c=" + studentViewModel.currentItem.Id;
                var req = $.get(url,
                    function (success) {
                		if (success.indexOf("Success") > -1) {
                            alert("Student successfully enrolled in course.");
                            $("#enroll-div").hide();
                			$("#drop-class-div").show();
                        } else {
                            alert("There was a problem enrolling in the course. Contact the administrators if this problem continues.");
                        }
                    app.mobileApp.hideLoading();
                }).fail(function() {
                    alert("There was a problem enrolling in the course. Contact the administrators if this problem continues.");
                    app.mobileApp.hideLoading();
                });
            },
            dropCourse: function(e) {
                app.mobileApp.showLoading();
                var url = dropClassUrl + app.currentUser.Id + "&c=" + studentViewModel.currentItem.Id;
                var req = $.get(url,
                    function (success) {
                		if (success.indexOf("Success") > -1) {
                            alert("Student successfully dropped from course.");
                            $("#enroll-div").show();
                			$("#drop-class-div").hide();
                        } else {
                            alert("There was a problem dropping the course. Contact the administrators if this problem continues.");
                        }
                    app.mobileApp.hideLoading();
                }).fail(function() {
                    alert("There was a problem dropping the course. Contact the administrators if this problem continues.");
                    app.mobileApp.hideLoading();
                });
            }
        });

    parent.set('studentViewModel', studentViewModel);
})(app.studentView);

// START_CUSTOM_CODE_studentViewModel
// END_CUSTOM_CODE_studentViewModel