'use strict';

app.studentView = kendo.observable({

});

// START_CUSTOM_CODE_studentView

(function(parent) {
    var dataProvider = app.data.defaultProvider,
        enrolledClassesUrl = "https://platform.telerik.com/bs-api/v1/oixi02nRsPmqNOS7/Functions/GetEnrolledClasses?s=",
        enrollInClassUrl = "https://platform.telerik.com/bs-api/v1/oixi02nRsPmqNOS7/Functions/EnrollStudent?s=",
        dropClassUrl = "https://platform.telerik.com/bs-api/v1/oixi02nRsPmqNOS7/Functions/DropCourse?s=",
        getProfessor = function (prof) {
            var name = "Name Unavailable";
            
            if (app.professors === undefined) return name;
            
            for (var i = 0; i < app.professors.length; i++) {
                if (prof === app.professors[i].Id) {
                    name = app.professors[i].ProfessorName;
                }
            }
            return name;
        },
        swapGradeType = function (id) {
            var gt = "Grade Type Unavailable";
            
            if (app.gradeTypes === undefined) return gt;
            
            for (var i = 0; i < app.gradeTypes.length; i++) {
                if (id === app.gradeTypes[i].Id) {
                    gt = app.gradeTypes[i].Description;
                }
            }
            
            return gt;
        },
        setEnrolledState = function () {
            $("#enrollment-button").html("<span class=\"km-icon km-trash\"></span><span class=\"km-text\">Drop Class</span>");
            $("#grades-div").show();
        },
        setNotEnrolledState = function () {
            $("#enrollment-button").html("<span class=\"km-icon km-add\"></span><span class=\"km-text\">Enroll in Class</span>");
        },
        setFullState = function () {
            $("#class-full-div").show();
            $("#enrollment-button").html("<span class=\"km-icon km-stop\"></span><span class=\"km-text\">Class Full</span>");
        },
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
                    dataItem.ProfessorName = getProfessor(dataItem.Professor);                    
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
            getGrades: function(s,c) {
                // filter down to this student, this course
                var filter = {
                    'AssignedTo' : app.currentUser.Id,
                    'Course' : studentViewModel.currentItem.Id
                };

                var grades = dataProvider.data('CourseGrade');
                grades.get(filter,
                    function (success) {
                    	// fix data slightly
                    	if (success.result.length < 1) {
                            $("#no-grades-yet").show();
                            $("#grades-div").hide();
                            return;
                        } else {
                            $("#grades-div").show();
                            $("#no-grades-yet").hide();
                            for (var i = 0; i < success.result.length; i++) {
                                success.result[i].GradeType = swapGradeType(success.result[i].GradeFor);
                            }

                            $("#grade-list").data('kendoMobileListView').setDataSource(new kendo.data.DataSource({
                                data: success.result
                            }));
                        }
                },  function (fail) {
                    	$("#no-grades-yet").show();
                });
            },
            studentShow: function(e) {
                $("#no-course-view").hide();
                $("#enrolled-course-list").show();

                var url = enrolledClassesUrl + app.currentUser.Id;
                var req = $.get(url,
                    function (success) {
                    
                    if (success.length < 1) {
                        $("#no-course-view").show();
                		$("#enrolled-course-list").hide();
                    } else {
                        for (var i = 0; i < success.length; i++) {
                            success[i].ProfessorName = getProfessor(success[i].Professor);
                        }

                        $("#enrolled-courses-list").data("kendoMobileListView").setDataSource(new kendo.data.DataSource({
                            data: success
                        }));
                    }
                }).fail(function() {
                    alert("Error loading data. Check with admins!");
                });
            },
            navSource: null,
            itemClick: function(e) {
                studentViewModel.set('currentItem', e.dataItem);
                studentViewModel.navSource = 'enrolled';
                app.mobileApp.navigate('#components/studentView/details.html');
            },
            courseClick: function(e) {
                studentViewModel.set('currentItem', e.dataItem);
                studentViewModel.navSource = 'courselist';
                app.mobileApp.navigate('#components/studentView/details.html');
            },
            enrollState: null,
            detailsShow: function(e) {
                // default, hide everything, reset button, only show what is relevant
                $("#grades-div").hide();
                $("#no-grades-yet").hide();
                $("#class-full-div").hide();
                $("#enrollment-button").removeClass("km-state-active");
                
                var source = studentViewModel.navSource;
                
                if (source === "enrolled") {
                    studentViewModel.set('enrollState', "enrolled");
                    studentViewModel.getGrades();
					setEnrolledState();
                    return;
                } 
                
                if (source === "courselist") {
                    if (studentViewModel.currentItem.Enrollment !== undefined) {
                        if ($.inArray(app.currentUser.Id, studentViewModel.currentItem.Enrollment) > -1) {
                            // > -1 => student is in array, so show drop 
                            studentViewModel.set('enrollState', "enrolled");
                            studentViewModel.getGrades();
                    		setEnrolledState();
                        } else {
                            // if class is not full, student may enroll
                            if (studentViewModel.currentItem.Enrollment.length >= studentViewModel.currentItem.EnrollmentCap) {
                                // class full
                                studentViewModel.set('enrollState', "full");
								setFullState();
                            } else {
                                studentViewModel.set('enrollState', "notenrolled");
                                setNotEnrolledState();
                            }
                        }
                    } else {
                        // undefined => no enrollment yet, so student can enroll
                        studentViewModel.set('enrollState', "notenrolled");
                        setNotEnrolledState();
                    }
                }
            },
            currentItem: null,
            courseListShow: function(e) {
                studentViewModel.dataSource.read();
            },
            enrollmentAction: function(e) {
                app.mobileApp.showLoading();
                $(e.currentTarget).removeClass("km-state-active");
                if (studentViewModel.enrollState === "enrolled") {
                    var url = dropClassUrl + app.currentUser.Id + "&c=" + studentViewModel.currentItem.Id;
                    var req = $.get(url,
                        function (success) {
                            if (success.indexOf("Success") > -1) {
                                alert("Student successfully dropped from course.");
                                studentViewModel.set('enrollState', "notenrolled");
								setNotEnrolledState();
                            } else {
                                alert("There was a problem dropping the course. Contact the administrators if this problem continues.");
                            }
                        app.mobileApp.hideLoading();
                    }).fail(function() {
                        alert("There was a problem dropping the course. Contact the administrators if this problem continues.");
                        app.mobileApp.hideLoading();
                    });
                } 
                
                if (studentViewModel.enrollState == "notenrolled") {
                    var url = enrollInClassUrl + app.currentUser.Id + "&c=" + studentViewModel.currentItem.Id;
                    var req = $.get(url,
                        function (success) {
                            if (success.indexOf("Success") > -1) {
                                alert("Student successfully enrolled in course.");
                                studentViewModel.set('enrollState', "enrolled");
                                setEnrolledState();
                            } else {
                                alert("There was a problem enrolling in the course. Contact the administrators if this problem continues.");
                            }
                        app.mobileApp.hideLoading();
                    }).fail(function() {
                        alert("There was a problem enrolling in the course. Contact the administrators if this problem continues.");
                        app.mobileApp.hideLoading();
                    });
                }
            }
        });

    parent.set('studentViewModel', studentViewModel);
})(app.studentView);
// END_CUSTOM_CODE_studentView
// START_CUSTOM_CODE_studentViewModel
// END_CUSTOM_CODE_studentViewModel