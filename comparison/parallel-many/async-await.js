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


async function fetchPostIds() {
  return Promise.resolve([
    "58bd800fec4f585c09b004ec",
    "58bd812fec3f585c09b005aa",
    "58bf2d19501b3861de006912",
    "58bf2d1e398bcc13e95822ae"
  ]);
}

async function fetchPostById(id) {
  return Promise.resolve(find(posts, 'id', id));
}

async function savePostToFile(post) {
  return new Promise((resolve, reject) => {
    // we wont really save to a file here, just fake some random delay
    setTimeout(resolve, (Math.random() * 100) + 100);
  });
}

async function createIndex() {
  const ids = await fetchPostIds();
  return Promise.all(ids.map(async function(id) {
    return savePostToFile(await fetchPostById(id));
  }));
}

test('test delay', (t) => {
  t.plan(1);
  const start = Date.now();
  createIndex().then(
    () => {
      const delta = (Date.now() - start);
      t.ok(delta > 100 && delta < 250);
    },
    (e) => t.fail(e.message)
  );
});
