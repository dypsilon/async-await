const test = require('tape');
const find = require('../../utility/find');

const posts = [
  {
    "id": "58bd800fec4f585c09b004ec",
    "title": "Never trust a skinny cook.",
    "slug": "never-trust-a-skinny-cook",
    "isCommentingEnabled": true,
  },
  {
    "id": "58bd812fec3f585c09b005aa",
    "title": "Youth is wasted on the young.",
    "slug": "youth-is-wasted-on-the-young",
    "isCommentingEnabled": false,
  },
  {
    "id": "58bf2d19501b3861de006912",
    "title": "The things you own end up owning you.",
    "slug": "the-things-you-own-end-up-owning-you",
    "isCommentingEnabled": false,
  },
  {
    "id": "58bf2d1e398bcc13e95822ae",
    "title": "A leader is best when people barely know that he exists.",
    "slug": "a-leader-is-best-when-people-barely-know-that-he-exists",
    "isCommentingEnabled": false,
  }
];


async function fetchPostIds() {
  return Promise.resolve([
    "58bd800fec4f585c09b004ec",
    "58bd812fec3f585c09b005aa",
    "58bf2d19501b3861de006912",
    "58bf2d1e398bcc13e95822ae"
  ]);
}


let postAPIBlock = false;
// we fake a delay in this function to fake an api
// this fake api allows only one request at a time, otherwise the function will
// thow an error.
function fetchPostById(id) {
  if (postAPIBlock === true) {
    return Promise.reject(new Error('The API is blocked. Try again later.'));
  }

  postAPIBlock = true;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      postAPIBlock = false; // we release the block after a timeout
      return resolve(find(posts, 'id', id));
    }, (Math.random() * 100) + 100);
  });
}

function savePostToFile(post) {
  return new Promise((resolve, reject) => {
    // we wont really save to a file here, just fake some random delay
    setTimeout(() => {
      resolve(post.slug + '.json');
    }, (Math.random() * 100) + 100);
  });
}

// this is the core function
// we have to nest promises here to acheive sequential execution
function createIndex() {
  return fetchPostIds().then((ids) => {
    return ids.reduce((p, id) => {
      return p.then((files) => {
        return fetchPostById(id).then(savePostToFile).then((file) => {
          files.push(file);
          return files;
        });
      });
    }, Promise.resolve([]));
  });
}


test('api is blocking', (t) => {
  t.plan(1);

  fetchPostById("58bd800fec4f585c09b004ec");
  fetchPostById("58bd812fec3f585c09b005aa").then(
    () => t.fail(),
    (e) => {
      setTimeout(() => {
        t.ok(/API is blocked/.test(e.message))
      }, 200); // create a dealy to unblock the api for the next test
    }
  )
});

test('create index', (t) => {
  t.plan(1);

  createIndex().then(
    (files) => t.ok(files.length == 4),
    (e) => t.fail(e.message)
  );
});
