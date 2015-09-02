'use strict';

app.facultyView = kendo.observable({

});

// START_CUSTOM_CODE_facultyView
// END_CUSTOM_CODE_facultyView
(function(parent) {
    var dataProvider = app.data.defaultProvider,
        studentsForCourseUrl = "https://platform.telerik.com/bs-api/v1/oixi02nRsPmqNOS7/Functions/GetStudentsForCourse?c=",
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
                }
            },
            schema: {
                model: {
                    fields: {
                        'Title': {
                            field: 'Title',
                            defaultValue: ''
                        },
                    }
                }
            },
        },
        dataSource = new kendo.data.DataSource(dataSourceOptions),
        facultyViewModel = kendo.observable({
            dataSource: dataSource,
            facultyCoursesShow: function(e) {
                $("#no-courses").hide();
                
                var filter = {
                    'Professor': app.currentUser.Id
                };
                
                var courses = dataProvider.data('Course');
                courses.get(filter,
                           function (success) {
								if (success.result.length < 1) {
                                    $("#no-courses").show();
                                } else {
                                    $("#faculty-course-view").data("kendoMobileListView").setDataSource(new kendo.data.DataSource({
                                        data: success.result
                                    }));
                                }
                }, function (fail) {
                    $("#no-courses").show();
                });
            },
            itemClick: function(e) {
                facultyViewModel.set('currentItem', e.dataItem);
                app.mobileApp.navigate('#components/facultyView/details.html');
            },
            detailsShow: function(e) {
                $("#course-student-list").show();
                $("#no-students-enrolled-div").hide();
                
				// get student list for this course
                var url = studentsForCourseUrl + facultyViewModel.currentItem.Id;
                
                var r = $.get(url, function (success) {
                    if (success.status === "fail") {
                        alert(success.result);
                    } else {
                        if (success.result.length == 0) {
                            $("#course-student-list").hide();
                            $("#no-students-enrolled-div").show();
                        } else {
                            $("#student-list").data("kendoMobileListView").setDataSource(new kendo.data.DataSource({
                                data: success.result
                            }));
                        }
                    }
                }).fail(function () {
                    console.log("fail at getting student list");
                });
                
            },
            currentItem: null,
            studentDetailsClick: function (e) {
                facultyViewModel.set('currentStudent', e.dataItem);
                $("#studentActionSheet").data("kendoMobileActionSheet").open();
            },
            assignGradeClick: function (e) {
                app.mobileApp.navigate('#components/facultyView/assignGrade.html');
            },
            sendMessageClick: function (e) {
                app.mobileApp.navigate('#components/facultyView/sendMessage.html');
            },
            currentStudent: null,
            getName: function (e) {
                return app.currentUser.DisplayName;
            },
            sendMessageShow: function (e) {
                
            },
            assignGradeShow: function (e) {
                
            },
            unClick: function(e) {
                $(e.currentTarget).removeClass("km-state-active");
            }
        });

    parent.set('facultyViewModel', facultyViewModel);
})(app.facultyView);

// START_CUSTOM_CODE_facultyViewModel
// END_CUSTOM_CODE_facultyViewModel