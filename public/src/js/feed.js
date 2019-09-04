/* globals componentHandler, readAllData */
/* eslint-disable no-console, no-global-assign */
const shareImageButton = document.querySelector('#share-image-button');
const createPostArea = document.querySelector('#create-post');
const closeCreatePostModalButton = document.querySelector(
  '#close-create-post-modal-btn'
);
const sharedMomentsArea = document.querySelector('#shared-moments');

function openCreatePostModal() {
  createPostArea.style.display = 'block';
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
  createPostArea.style.display = 'none';
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
