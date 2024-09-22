import * as yup from 'yup';
import i18next from './i18n';

const renderInitialText = (elements, i18n) => {
  for (let elementKey in elements) {
    elements[elementKey].textContent = i18n.t(elementKey);
  }
};

const parseRSS = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');
  const parseError = doc.querySelector('parsererror');

  if (parseError) {
    throw new Error(i18next.t('parseError'));
  }

  const feedTitle = doc.querySelector('channel > title').textContent;
  const feedDescription = doc.querySelector('channel > description').textContent;

  const items = doc.querySelectorAll('item');
  const posts = Array.from(items).map((item) => ({
    title: item.querySelector('title').textContent,
    link: item.querySelector('link').textContent,
    description: item.querySelector('description').textContent,
    id: item.querySelector('guid').textContent,
  }));

  return {
    feed: {
      title: feedTitle,
      description: feedDescription,
      url: doc.querySelector('channel > link').textContent,
    },
    posts,
  };
};

const updateUI = () => {
  const feedsContainer = document.querySelector('.feeds');
  const postsContainer = document.querySelector('.posts');

  feedsContainer.innerHTML = state.feeds
    .map(
      (feed) => `
      <div class="card mb-3">
        <div class="card-body">
          <h5 class="card-title">${i18next.t('feedTitle', { title: feed.title })}</h5>
          <p class="card-text">${i18next.t('feedDescription', {
            description: feed.description,
          })}</p>
        </div>
      </div>
    `,
    )
    .join('');

  postsContainer.innerHTML = state.posts
    .map(
      (post) => `
      <li class="list-group-item d-flex justify-content-between align-items-center ${
        state.readPosts.has(post.id) ? 'fw-normal' : 'fw-bold'
      }">
        <a href="${post.link}" target="_blank" rel="noopener noreferrer">${post.title}</a>
        <button class="btn btn-primary btn-sm" data-post-id="${post.id}">${i18next.t(
        'previewButton',
      )}</button>
      </li>
    `,
    )
    .join('');
};

const handleError = (message) => {
  const feedbackElement = document.querySelector('.feedback');
  feedbackElement.textContent = i18next.t(message);
  feedbackElement.classList.add('text-danger');
};

const resetForm = () => {
  const input = document.querySelector('#url-input');
  input.value = '';
  input.classList.remove('is-invalid');
  input.focus();
  const feedbackElement = document.querySelector('.feedback');
  feedbackElement.textContent = '';
  feedbackElement.classList.remove('text-danger');
};

const checkUniqueUrl = (url) => {
  return !state.feeds.some((feed) => feed.url === url);
};

export const app = () => {
  const state = {
    feeds: [],
    posts: [],
    feedPostIds: {},
    readPosts: new Set(),
  };

  const elements = {
    pageTitle: document.querySelector('title'),
    modalTitle: document.querySelector('.modal-title'),
    modalBody: document.querySelector('.modal-body'),
    readMore: document.querySelector('.modal-footer a'),
    closeButton: document.querySelector('.modal-footer button'),
    appTitle: document.querySelector('h1'),
    intro: document.querySelector('.lead'),
    urlInput: document.querySelector('.form-floating input'),
    urlInputLabel: document.querySelector('.form-floating label'),
    addButton: document.querySelector('#addButton'),
    exampleText: document.querySelector('#exampleText'),
    feedback: document.querySelector('.feedback'),
    footerText: document.querySelector('#footerText'),
    footerLink: document.querySelector('#footerText a'),
  };

  i18next.on('initialized', () => {
    yup.setLocale({
      mixed: {
        required: i18next.t('validation.required'),
        notOneOf: i18next.t('validation.notOneOf'),
      },
      string: {
        url: i18next.t('validation.url'),
      },
    });

    renderInitialText(elements, i18next);
  });

  const schema = yup.object().shape({
    url: yup.string().url(i18next.t('validation.url')).required(i18next.t('valudation.required')),
  });

  document.querySelector('#form').addEventListener('submit', (e) => {
    e.preventDefault();

    const input = document.querySelector('#url-input');
    const url = input.value.trim();

    if (!checkUniqueUrl(url)) {
      input.classList.add('is-invalid');
      handleError('urlAlreadyExists');
      return;
    }

    schema
      .validate({ url })
      .then(() => {
        fetch(`https://allorigins.hexlet.app/get?url=${encodeURIComponent(url)}`)
          .then((response) => response.text())
          .then((data) => {
            const { feed, posts } = parseRSS(data);
            state.feeds.push(feed);
            state.posts.push(...posts);
            updateUI();
            resetForm();
          })
          .catch(() => handleError('networkError'));
      })
      .catch((error) => {
        input.classList.add('is-invalid');
        handleError(error.message);
      });
  });

  document.querySelector('.posts').addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const postId = e.target.getAttribute('data-post-id');
      state.readPosts.add(postId);
      updateUI();
    }
  });
};
