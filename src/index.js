import * as yup from 'yup';
import i18next from './i18n';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const state = {
  feeds: [],
  posts: [],
  feedPostIds: {},
  readPosts: new Set(),
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

  updateTextContent();
});

const updateTextContent = () => {
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const i18nKey = element.getAttribute('data-i18n');
    if (
      element.tagName === 'INPUT' ||
      element.tagName === 'TEXTAREA' ||
      element.tagName === 'BUTTON'
    ) {
      element.placeholder = i18next.t(i18nKey);
    } else if (element.tagName === 'LABEL') {
      element.textContent = i18next.t(i18nKey);
    } else {
      element.textContent = i18next.t(i18nKey);
    }
  });
};

const schema = yup.object().shape({
  url: yup.string().url('Введите корректный URL').required('Поле не должно быть пустым'),
});

const parseRSS = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');
  const parseError = doc.querySelector('parsererror');

  if (parseError) {
    throw new Error('Ошибка парсинга RSS');
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
        <p class="card-text">${i18next.t('feedDescription', { description: feed.description })}</p>
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
