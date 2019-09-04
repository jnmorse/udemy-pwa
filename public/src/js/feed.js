/* globals componentHandler, readAllData, writeData */
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

function openCreatePostModal() {
  createPostArea.classList.add('show');
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
  fetch('https://pwagram-4d112.firebaseio.com/posts.json', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      id: new Date().toISOString(),
      title: titleInput.value,
      location: locationInput.value,
      image:
        'https://firebasestorage.googleapis.com/v0/b/pwagram-4d112.appspot.com/o/sf-boat.jpg?alt=media&token=04be06a7-1ad5-40c9-8f60-714edc6d7599'
    })
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
        image:
          'https://firebasestorage.googleapis.com/v0/b/pwagram-4d112.appspot.com/o/sf-boat.jpg?alt=media&token=04be06a7-1ad5-40c9-8f60-714edc6d7599'
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
