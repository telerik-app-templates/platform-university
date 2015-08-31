'use strict';

app.messageView = kendo.observable({
    onShow: function() {},
    afterShow: function() {}
});

// START_CUSTOM_CODE_messageView
// END_CUSTOM_CODE_messageView
(function(parent) {
    var dataProvider = app.data.defaultProvider,
        archiveUrl = "https://platform.telerik.com/bs-api/v1/oixi02nRsPmqNOS7/Functions/ArchiveMessage?m=",
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
                typeName: 'Message',
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
                        'Content': {
                            field: 'Content',
                            defaultValue: ''
                        },
                    }
                }
            },
        },
        dataSource = new kendo.data.DataSource(dataSourceOptions),
        messageViewModel = kendo.observable({
            dataSource: dataSource,
            listname: null,
            messageListShow: function(e) {
                if (e.view.id.indexOf("sView") > -1) {
                    messageViewModel.listname = "#s-messages-list";
                } else {
                    messageViewModel.listname = "#f-messages-list";
                }
                
                var filter = {
                    'User' : app.currentUser.Id,
                    'IsArchived' : false
                };

                var messages = dataProvider.data('Message');
                messages.get(filter,
                	function (success) {
                    	$(messageViewModel.listname).data("kendoMobileListView").setDataSource(new kendo.data.DataSource({
                            data: success.result
                        }));
                }, 
					function (error) {
                    alert("Error retrieving messages.  Try again later, please.");
                });
            },
            itemClick: function(e) {
                messageViewModel.set('currentItem', e.dataItem);
                app.mobileApp.navigate('#components/messageView/details.html');
            },
            detailsShow: function(e) {
                $("#archive-message-button").removeClass("km-state-active");
            },
            currentItem: null,
            archive: function(e) {
                $(e.currentTarget).removeClass("km-state-active");
                
                app.mobileApp.showLoading();
                var url = archiveUrl + messageViewModel.currentItem.Id;
                var req = $.get(url,
                    function (success) {
                		if (success.indexOf("Success") > -1) {
                            alert("Message archived successfully.");
                            app.mobileApp.navigate("#:back");
                        } else {
                            alert("There was a problem archiving this message. Please try again later.");
                        }
                    app.mobileApp.hideLoading();
                }).fail(function() {
                    alert("There was a problem archiving this message. Please try again later.");
                    app.mobileApp.hideLoading();
                });
            }
        });

    parent.set('messageViewModel', messageViewModel);
})(app.messageView);

// START_CUSTOM_CODE_messageViewModel
// END_CUSTOM_CODE_messageViewModel