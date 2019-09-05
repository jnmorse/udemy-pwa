/* eslint-disable max-lines-per-function */
/* eslint-disable no-console */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const webPush = require('web-push');

/*
 * // Create and Deploy Your First Cloud Functions
 * // https://firebase.google.com/docs/functions/write-firebase-functions
 *
 */

const serviceAcount = require('./fb-creds.json');

admin.initializeApp({
  databaseURL: 'https://pwagram-4d112.firebaseio.com/',
  credential: admin.credential.cert(serviceAcount)
});

exports.storePostData = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    admin
      .database()
      .ref('posts')
      .push({
        id: request.body.id,
        title: request.body.title,
        location: request.body.location,
        image: request.body.image
      })
      .then(() => {
        webPush.setVapidDetails(
          'mailto:tamed.lionheart@gmail.com',
          functions.config().webpush.public,
          functions.config().webpush.private
        );
        return admin
          .database()
          .ref('subscriptions')
          .once('value');
      })
      .then(subscriptions => {
        subscriptions.forEach(sub => {
          const pushConfig = {
            endpoint: sub.val().endpoint,
            keys: {
              auth: sub.val().keys.auth,
              p256dh: sub.val().keys.p256dh
            }
          };

          webPush
            .sendNotification(
              pushConfig,
              JSON.stringify({
                title: 'New Post',
                content: 'New Post added!',
                openUrl: '/help'
              })
            )
            .catch(err => {
              console.log(err);
            });
        });
        response
          .status(201)
          .json({ message: 'Data stored', id: request.body.id });
      })
      .catch(err => {
        response.status(500).json({ error: err });
      });
  });
});
