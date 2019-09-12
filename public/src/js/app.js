/* eslint-disable no-console */
/* globals urlBase64ToUint8Array */
const enableNotificationsButton = document.querySelectorAll(
  '.enable-notifications'
);

if (!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/service-worker.js')
    .then(() => {
      console.log('Service worker registered!');
    })
    .catch(err => {
      console.log(err);
    });
}

function displayConfirmationNotification() {
  if ('serviceWorker' in navigator) {
    const options = {
      body: 'Notifications where successfully enabled',
      icon: '/src/images/icons/app-icon-96x96.png',
      image: '/src/images/sf-boat.jpg',
      dir: 'ltr',
      lang: 'en-US',
      vibrate: [100, 50, 200],
      badge: '/src/images/icons/app-icon-96x96.png',
      tag: 'confirm-notification',
      renotify: false,
      actions: [
        {
          action: 'confirm',
          title: 'okay',
          icon: '/src/images/icons/app-icon-96x96.png'
        },
        {
          action: 'cancel',
          title: 'cancel',
          icon: '/src/images/icons/app-icon-96x96.png'
        }
      ]
    };

    navigator.serviceWorker.ready.then(sw => {
      sw.showNotification('Notifications Enabled', options);
    });
  }
}

function confirmPushSub() {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  let reg;
  return navigator.serviceWorker.ready
    .then(sw => {
      reg = sw;
      return sw.pushManager.getSubscription();
    })
    .then(sub => {
      if (sub === null) {
        const vapidPublicKey =
          'BKDUuVad_fed6STJ66rFIQjDOpIsEStNuNHDwhZgaS5AFw3bLOiViUYy6s5BqKSgxI_ZVMlZ64YAttTvCXXqffQ';
        const convertedPublicKey = urlBase64ToUint8Array(vapidPublicKey);

        // create new Subscription
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedPublicKey
        });
      }

      throw new Error('already subscribed');
    })
    .then(newSub => {
      if (!newSub) {
        return null;
      }
      console.log(newSub);
      return fetch('https://pwagram-4d112.firebaseio.com/subscriptions.json', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(newSub)
      });
    })
    .then(res => {
      if (res.ok) {
        displayConfirmationNotification();
      }
    })
    .catch(error => console.log(error));
}

function askForNotificationPermission() {
  Notification.requestPermission(result => {
    if (result !== 'granted') {
      return null;
    }

    return confirmPushSub();
    // return displayConfirmationNotification();
  });
}

if ('Notification' in window && 'serviceWorker' in navigator) {
  for (let i = 0; i < enableNotificationsButton.length; i += 1) {
    const button = enableNotificationsButton[i];
    button.style.display = 'inline-block';
    button.addEventListener('click', askForNotificationPermission);
  }
}
