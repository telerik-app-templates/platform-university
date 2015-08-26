'use strict';

app.studentView = kendo.observable({
/*    onShow: function() {},
    afterShow: function() {}*/
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
                studentViewModel.dataSource.filter({ field: 'Enrollment', operator: 'contains', value: app.currentUser.Id });
                
                if (studentViewModel.dataSource.view().length < 1) {
                    $("#no-course-view").show();
                	$("#enrolled-course-list").hide();
                }
            },
            navSource: null,
            itemClick: function(e) {
                studentViewModel.navSource = "enrollment";
                app.mobileApp.navigate('#components/studentView/details.html?uid=' + e.dataItem.uid);
            },
            courseClick: function(e) {
                studentViewModel.navSource = "courses";
                app.mobileApp.navigate('#components/studentView/details.html?uid=' + e.dataItem.uid);
            },
            detailsShow: function(e) {
                $("#enroll-div").hide();
                $("#leave-class-div").hide();
                
                var item = e.view.params.uid,
                    dataSource = studentViewModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);
                if (!itemModel.Title) {
                    itemModel.Title = String.fromCharCode(160);
                }
                studentViewModel.set('currentItem', itemModel);
                
                if (itemModel.Enrollment === undefined) { 
                    // can enroll, no students are enrolled since array is undefined
                    $("#enroll-div").show();
                }
                
                if (itemModel.Enrollment !== undefined && $.inArray(app.currentUser.Id, itemModel.Enrollment) < 0) {
                    // there is enrollment, just not this student, so can enroll
                    $("#enroll-div").show();
                }
            },
            currentItem: null,
            courseListShow: function(e) {
                studentViewModel.dataSource.filter({});
                console.log(studentViewModel.dataSource.view());
            },
            enrollUser: function(e) {
                //app.mobileApp.showLoading();
                console.log(studentViewModel.currentItem);
                console.log(app.currentUser);
            }
        });

    parent.set('studentViewModel', studentViewModel);
})(app.studentView);

// START_CUSTOM_CODE_studentViewModel
// END_CUSTOM_CODE_studentViewModel