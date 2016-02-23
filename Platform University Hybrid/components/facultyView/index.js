'use strict';

app.facultyView = kendo.observable({

});

// START_CUSTOM_CODE_facultyView

(function(parent) {
    var dataProvider = app.data.defaultProvider,
        studentsForCourseUrl = "https://platform.telerik.com/bs-api/v1/oixi02nRsPmqNOS7/Functions/GetStudentsForCourse?c=",
        swapGradeType = function (id) {
            var gt = "Grade Type Unavailable";
            
            for (var i = 0; i < app.gradeTypes.length; i++) {
                if (id === app.gradeTypes[i].Id) {
                    gt = app.gradeTypes[i].Description;
                }
            }
            
            return gt;
        },
        dataSourceOptions = {
            type: 'everlive',
            transport: {
                typeName: 'Course',
                dataProvider: dataProvider
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
                                    for (var i = 0; i < success.result.length; i++)
                                    {
                                        if (success.result[i].Enrollment === undefined) {
                                            success.result[i].EnrollmentCount = 0;
                                        } else {
                                            success.result[i].EnrollmentCount = success.result[i].Enrollment.length;
                                        }
                                    }
                                    
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
                    alert("There was a problem accessing the student list.  Try again later.");
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
                $("#message-content").val("");
            },
            resetGrades: function (e) {
                // reset value
                $("#grade-given").val("");
                
                // filter down to current student, current course
                var filter = {
                    'AssignedTo' : facultyViewModel.currentStudent.Id,
                    'Course' : facultyViewModel.currentItem.Id
                };

                var grades = dataProvider.data('CourseGrade');
                grades.get(filter,
                    function (success) {
                    	// fix data slightly
                    	if (success.result.length < 1) {
                            $("#assign-no-grades").show();
                            $("#assign-has-grades").hide();
                        } else {
                            $("#assign-has-grades").show();
                            $("#assign-no-grades").hide();
                            for (var i = 0; i < success.result.length; i++) {
                                success.result[i].GradeType = swapGradeType(success.result[i].GradeFor);
                            }

                            $("#faculty-grade-list").data('kendoMobileListView').setDataSource(new kendo.data.DataSource({
                                data: success.result
                            }));
                        }
                },  function (fail) {
                    	$("#assign-no-grades").show();
                });                
            },
            assignGradeShow: function (e) {
                // get current course grades for student, to not duplicate
				facultyViewModel.resetGrades();
                
                // check dropdown, if length is zero we populate options
                if ($("#grade-type-list option").length < 1) {
                    var options = $("#grade-type-list");

                    $.each(app.gradeTypes, function() {
                        options.append($("<option />").val(this.Id).text(this.Description));
                    });
                }
                
            },
            submitGrade: function (e) {
                app.mobileApp.showLoading();
                
                // grab values, then submit
                var courseGrade = {
                    AssignedBy: app.currentUser.Id,
                    AssignedTo: facultyViewModel.currentStudent.Id,
                    Course: facultyViewModel.currentItem.Id,
                    Grade: $("#grade-given").val(),
                    GradeFor: $("#grade-type-list option:selected").val()
                };

                var cg = dataProvider.data('CourseGrade');
                cg.create(courseGrade,
                         function (success) {
                    alert("Grade entered successfully!");
                    facultyViewModel.resetGrades();
                    app.mobileApp.hideLoading();
                }, function (fail) {
                    alert("Failed to submit grade.  Try again or contact helpdesk if this problem persists.");
                    app.mobileApp.hideLoading();
                });
            },
            deliverMessage: function (e) {
                app.mobileApp.showLoading();
                var mm = dataProvider.data('Message');
                var newMessage = {
                    User: facultyViewModel.currentStudent.Id,
                    From: app.currentUser.Id,
                    Title: facultyViewModel.currentItem.Title + " (" + app.currentUser.DisplayName + ")",
                    IsRead: false,
                    IsArchived: false,
                    Content: $("#message-content").val()
                };
                mm.create(newMessage,
                         function (success) {
                    alert("Message successfully sent to " + facultyViewModel.currentStudent.Name);
                    app.mobileApp.navigate("#:back");
                    app.mobileApp.hideLoading();
                }, function (fail) {
                    alert("Error sending message.  Try again or contact the helpdesk if problem persists.");
                    app.mobileApp.hideLoading();
                });
            }
        });

    parent.set('facultyViewModel', facultyViewModel);
})(app.facultyView);

// END_CUSTOM_CODE_facultyView