// This example requires at least node 7.7 to run
const test = require('tape');
const find = require('../../utility/find');

const posts = [
  {
    "id": "58bd800fec4f585c09b004ec",
    "title": "Never trust a skinny cook.",
    "isCommentingEnabled": true,
  },
  {
    "id": "58bd812fec3f585c09b005aa",
    "title": "Youth is wasted on the young.",
    "isCommentingEnabled": false,
  },
  {
    "id": "58bf2d19501b3861de006912",
    "title": "The things you own end up owning you.",
    "isCommentingEnabled": false,
  },
  {
    "id": "58bf2d1e398bcc13e95822ae",
    "title": "A leader is best when people barely know that he exists.",
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

function fetchPostById(id, cb) {
  return cb(null, find(posts, 'id', id));
}

function savePostToFile(post, cb) {
  // we wont really save to a file here, just fake some random delay
  setTimeout(cb, Math.random() * (200 - 20) + 20);
}

function createIndex(reply) {
  let replyCalled = false;
  let doneCount = 0;

  let replyOnce = function(err) {
    if (!replyCalled) {
      replyCalled = true;
      return reply(err);
    }
  }

  fetchPostIds((err, ids) => {
    if (err) return replyOnce(err);

    for (i=0; i < ids.length; i++) {
      fetchPostById(ids[i], (err, post) => {
        if (err) return replyOnce(err);
        savePostToFile(post, (err) => {
          if (err) return replyOnce(err);
          doneCount++;
          if (doneCount == ids.length) {
            replyOnce();
          }
        });
      });
    }
  });
}

test('test delay', (t) => {
  t.plan(1);
  const start = Date.now();
  createIndex((err) => {
    if (err) return t.fail(e.message);

    const delta = (Date.now() - start);
    t.ok(delta > 100 && delta < 250);
  });
});
