'use strict';
var user_id;
var MESSAGE_API;
var notification_id;
var base_url = 'https://api.flashnotifier.com/notification';

function showNotification(title, body, icon, data) {
  console.log('showNotification');
  var notificationOptions = {
    body: body,
    icon: icon,
    tag: 'simple-push-demo-notification',
    data: data
  };
  return self.registration.showNotification(title, notificationOptions, function(){
  });
}

self.addEventListener('message', function(event) {
  console.log('Got it hooo', event.data);
  user_id = event.data['user_id'];
  MESSAGE_API =  base_url+'/get_notification_data?user_id='+user_id;
});
self.addEventListener('push', function(event) {
  console.log('Received a push message', event);
  event.waitUntil(
    fetch(MESSAGE_API)
      .then(function(response) {
        if (response.status !== 200) {
          throw new Error('Invalid status code from weather API: ' +
            response.status);
        }
        return response.json();
      })
      .then(function(data) {
        console.log('Message data: ', data);
        var title = data.title;
        var message = data.message;
        var icon = data.image;
        var notification_id = data.notification_id;
        var urlToOpen = data.target_url;

        var notificationFilter = {
          tag: 'simple-push-demo-notification'
        };

        var notificationData = {
          url: urlToOpen,
          user_id: user_id,
          notification_id: notification_id
        };

        if (!self.registration.getNotifications) {
          if (user_id){
          return showNotification(title, message, icon, notificationData);
          }
        }

        // Check if a notification is already displayed
        return self.registration.getNotifications(notificationFilter)
          .then(function(notifications) {
            if (notifications && notifications.length > 0) {
              // Start with one to account for the new notification
              // we are adding
              var notificationCount = 1;
              for (var i = 0; i < notifications.length; i++) {
                var existingNotification = notifications[i];
                if (existingNotification.data &&
                  existingNotification.data.notificationCount) {
                  notificationCount +=
                    existingNotification.data.notificationCount;
                } else {
                  notificationCount++;
                }
                existingNotification.close();
              }
              message = 'You have ' + notificationCount +
                ' notifications';
              notificationData.notificationCount = notificationCount;
            }
            if (user_id){
            return showNotification(title, message, icon, notificationData);
              }
          });
      })
      .catch(function(err) {
        console.error('A Problem occured with handling the push msg', err);
        return;
      })
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('Tracking: notificationclick');
  var url = event.notification.data.url;
  var notification_id = event.notification.data.notification_id;
  var myHeaders = new Headers();
  var action = 'accept';
  event.notification.close();
  fetch(base_url+'/send_notification_response?user_id='+user_id
      +"&notification_id="+notification_id+"&action="+action).then(function(response){
        console.log(response);
      })  
  event.waitUntil(clients.openWindow(url));
});
