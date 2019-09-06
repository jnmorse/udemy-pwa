/* globals componentHandler, readAllData, writeData, dataURItoBlob */
/* eslint-disable no-console, no-global-assign */
const shareImageButton = document.querySelector('#share-image-button');
const createPostArea = document.querySelector('#create-post');
const closeCreatePostModalButton = document.querySelector(
  '#close-create-post-modal-btn'
);
const sharedMomentsArea = document.querySelector('#shared-moments');
const form = document.querySelector('form');
const titleInput = document.querySelector('#title');
const locationInput = document.querySelector('#location');
const videoPlayer = document.querySelector('#player');
const canvasElement = document.querySelector('#canvas');
const captureButton = document.querySelector('#capture-btn');
const imagePicker = document.querySelector('#image-picker');
const imagePickerArea = document.querySelector('#pick-image');
const locationButton = document.querySelector('#location-btn');
const locationLoader = document.querySelector('#location-loader');
let fetchedLocation = null;

locationButton.addEventListener('click', () => {
  if (!('geolocation' in navigator)) {
    return null;
  }

  locationButton.style.display = 'none';
  locationLoader.style.display = 'block';

  return navigator.geolocation.getCurrentPosition(
    position => {
      const { latitude, longitude } = position.coords;
      locationButton.style.display = 'inline';
      locationLoader.style.display = 'none';
      fetchedLocation = { latitude, longitude };
      locationInput.value = 'in New Hampshire';
      locationInput.classList.add('is-focused');
    },
    error => {
      console.log(error);
      locationButton.style.display = 'inline';
      locationLoader.style.display = 'none';
      fetchedLocation = { latitude: null, longitude: null };
    },
    { timeout: 7000 }
  );
});

function initializeLocation() {
  if (!('geolocation' in navigator)) {
    locationButton.style.display = 'none';
  }
}

let picture;

function initializeMedia() {
  if (!('mediaDevices' in navigator)) {
    navigator.mediaDevices = {};
  }

  if (!('getUserMedia' in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = function GetUserMedia(constraints) {
      const getUserMedia =
        navigator.webkitGetUserMedia || navigator.mozUserMedia;

      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented'));
      }

      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }

  navigator.mediaDevices
    .getUserMedia({ video: { width: 320, height: 240 } })
    .then(stream => {
      captureButton.style.display = 'block';
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = 'block';
    })
    .catch(() => {
      imagePickerArea.style.display = 'block';
    });
}

captureButton.addEventListener('click', () => {
  canvasElement.style.display = 'block';
  videoPlayer.style.display = 'none';
  captureButton.style.display = 'none';

  const context = canvasElement.getContext('2d');

  context.drawImage(
    videoPlayer,
    0,
    0,
    canvasElement.width,
    videoPlayer.videoHeight / (videoPlayer.videoWidth / canvasElement.width)
  );

  videoPlayer.srcObject.getVideoTracks().forEach(track => {
    track.stop();
  });

  picture = dataURItoBlob(canvasElement.toDataURL());
});

imagePicker.addEventListener('change', event => {
  [picture] = event.target.files;
});

function openCreatePostModal() {
  createPostArea.classList.add('show');
  initializeMedia();
  initializeLocation();
  /*
   * if (deferredPrompt) {
   * deferredPrompt.prompt();
   *
   * deferredPrompt.userChoice.then(choiceResult => {
   * console.log(choiceResult.outcome);
   *
   * if (choiceResult.outcome === 'dismissed') {
   * console.log('User cancelled installation');
   * } else {
   * console.log('User added to home screen');
   * }
   * });
   *
   * deferredPrompt = null;
   *}
   */
}

function closeCreatePostModal() {
  createPostArea.classList.remove('show');
  imagePickerArea.style.display = 'none';
  videoPlayer.style.display = 'none';
  canvasElement.style.display = 'none';
  locationButton.style.display = 'inline';
  locationLoader.style.display = 'none';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

function createCard(post) {
  const cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  const cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = `url("${post.image}")`;
  cardTitle.style.backgroundSize = 'cover';
  cardWrapper.appendChild(cardTitle);
  const cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = post.title;
  cardTitle.appendChild(cardTitleTextElement);
  const cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = post.location;
  cardSupportingText.style.textAlign = 'center';
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  data.forEach(post => createCard(post));
}

const url = 'https://pwagram-4d112.firebaseio.com/posts.json';
let gotData = false;

fetch(url)
  .then(res => {
    return res.json();
  })
  .then(data => {
    if (!gotData) {
      const dataArray = [];

      Object.keys(data).forEach(key => {
        dataArray.push(data[key]);
      });

      updateUI(dataArray);
      gotData = true;
    }
  })
  .catch(error => console.info('Your offline', error.message));

if ('indexedDB' in window) {
  readAllData('posts').then(data => {
    console.log('read from cache', data);

    if (!gotData) {
      updateUI(data);
    }

    gotData = true;
  });
}

function sendData() {
  const id = new Date().toISOString();

  const postData = new FormData();

  postData.append('id', id);
  postData.append('title', titleInput.value);
  postData.append('location', locationInput.value);
  postData.append('rawLocation', fetchedLocation);
  postData.append('file', picture, `${id}.png`);

  fetch('https://us-central1-pwagram-4d112.cloudfunctions.net/storePostData', {
    method: 'post',
    body: postData
  })
    .then(res => res.json())
    .then(data => console.log('sent data', data))
    .catch(error => console.log('send data error', error));
}

form.addEventListener('submit', event => {
  event.preventDefault();

  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    return null;
  }

  closeCreatePostModal();

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    return navigator.serviceWorker.ready.then(sw => {
      const post = {
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
        rawLocation: fetchedLocation,
        picture
      };

      return writeData('sync-posts', post)
        .then(() => sw.sync.register('sync-new-posts'))
        .then(() => {
          const snackbarContainer = document.querySelector(
            '#confirmation-toast'
          );
          const data = { message: 'Your post was saved for syncing!' };
          snackbarContainer.MaterialSnackbar.showSnackbar(data);
        })
        .catch(error => console.log(error));
    });
  }
  sendData();

  return null;
});
