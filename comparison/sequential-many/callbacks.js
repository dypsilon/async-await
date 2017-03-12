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


function fetchPostIds(cb) {
  return cb(null, [
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
function fetchPostById(id, cb) {
  if (postAPIBlock === true) {
    return cb(new Error('The API is blocked. Try again later.'));
  }

  postAPIBlock = true;
  setTimeout(() => {
    postAPIBlock = false; // we release the block after a timeout
    return cb(null, find(posts, 'id', id));
  }, (Math.random() * 100) + 100);
}

function savePostToFile(post, cb) {
  // we wont really save to a file here, just fake some random delay
  setTimeout(() => {
    cb(null, post.slug + '.json');
  }, (Math.random() * 100) + 100);
}

// this is the core function
function createIndex(cb) {
  // we have to work with a recursive function here
  // if you really have many items you might want to use tail call optimization
  // or trampolining to avoid blowing the stack
  function next(ids, files) {
    if (!ids || ids.length < 1) return cb(null, files);
    let id = ids.shift();
    fetchPostById(id, (err, post) => {
      if (err) return cb(err);
      savePostToFile(post, (err, file) => {
        if (err) return cb(err);
        files.push(file);
        next(ids, files);
      });
    });
  }

  fetchPostIds((err, ids) => {
    if (err) return cb(err);
    next(ids, []);
  });
}


test('api is blocking', (t) => {
  t.plan(1);

  fetchPostById("58bd800fec4f585c09b004ec", () => {});
  fetchPostById("58bd812fec3f585c09b005aa", (err, result) => {
    if (!err) return t.fail();
    setTimeout(() => {
      t.ok(/API is blocked/.test(err.message))
    }, 200); // create a dealy to unblock the api for the next test
  });
});

test('create index', (t) => {
  t.plan(1);

  createIndex((err, files) => {
    if (err) return t.fail(err.message);
    t.ok(files.length == 4);
  });
});
