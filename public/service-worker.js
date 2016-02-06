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


self.addEventListener('push', function(event) {
  var user_id;
  var MESSAGE_API;

  function get_data(){
    var MESSAGE_API;
    console.log('Received a push message', event);
    return new Promise(function(resolve, reject){
      var request = indexedDB.open("user_data", 2);
      console.log('checkdata triggered');
      request.onerror = function(event){
      alert("Database error:"+ event.target.errorCode);
      };
      request.onsuccess = function(event){
        console.log('checkdata onsuccess triggered');
        var db = event.target.result;
        resolve(db);
      };
    }).then(function(db){
      return  new Promise(function(resolve_t, reject_t){
        var req_data = db.transaction(['users']).objectStore('users').get('1');
        req_data.onsuccess = function(event){
           console.log('test');
           console.log(req_data.result['user_id']);
           user_id = req_data.result['user_id'];
           console.log('response', user_id);
           MESSAGE_API = base_url+'/get_notification_data?user_id='+user_id;
           console.log(MESSAGE_API);
           resolve_t(MESSAGE_API);
        req_data.onerror =  function(event){
         console.log('some error: '+ event.target.error);
        }
        req_data.onblocked = function(event){
         console.log("its blocked");
        }
      };
    })
  });
}

event.waitUntil(
  get_data().then(function(MESSAGE_API){
    console.log(MESSAGE_API);
    console.log('new');
    return fetch(MESSAGE_API)})
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
)
})

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
