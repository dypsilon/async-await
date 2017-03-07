// This example requires at least node 7.7 to run
const test = require('tape');
const find = require('../../utility/find');

// simple storage for posts
const posts = [
  {
    "id": "58bd800fec4f585c09b004ec",
    "title": "Never trust a skinny cook.",
    "slug": "never-trust-a-skinny-cook",
    "isCommentingEnabled": true,
    "commentingAllowedFor": ["guest"]
  },
  {
    "id": "58bd812fec3f585c09b005aa",
    "title": "Youth is wasted on the young.",
    "slug": "youth-is-wasted-on-the-young",
    "isCommentingEnabled": false,
    "commentingAllowedFor": ["staff"]
  }
];

// simple storage for users
const users = [
  {
    "id": "58bd8386fafd1045a0eeff98",
    "role": "guest"
  },
  {
    "id": "58bd83a3267fb214e8e03b74",
    "role": "staff"
  }
];


// this function will just find a post corresponding to the slug and return it
async function fetchPostBySlug(slug) {
  return find(posts, 'slug', slug);
}

// this function accepts the id of the user and a post object and checks if
// the user is allowed to write a comment to the given post
async function isUserAllowedToComment(post, userId) {
  let user = find(users, 'id', userId);
  return post.commentingAllowedFor.includes(user.role);
}

// fakes an insert operation into the database
// return the "new" record
async function insertComment(postId, userId, message) {
  return Promise.resolve({
    "record": {
      "id": "58bd80ca22d44764e4bb6dfc",
      "post": postId,
      "user": userId,
      "message": message
    }
  });
}

async function addComment(comment) {
  const post = await fetchPostBySlug(comment.postSlug);

  if (!post.isCommentingEnabled) {
    throw new Error('Commenting is disabled.');
  }

  const isAllowed = await isUserAllowedToComment(post, comment.user);

  if (!isAllowed) {
    throw new Error('The user is not allowed to comment on this post.');
  }

  const result = await insertComment(post.id, comment.user, comment.message);

  return result.record;
}

// lets test the different possibilies

test('happy path', function (t) {
  t.plan(1);

  addComment({
    "user": "58bd8386fafd1045a0eeff98",
    "postSlug": "never-trust-a-skinny-cook",
    "message": "A little learning is a dangerous thing."
  }).then((result) => {
    t.deepEqual(
      result,
      {
        id: '58bd80ca22d44764e4bb6dfc',
        post: '58bd800fec4f585c09b004ec',
        user: '58bd8386fafd1045a0eeff98',
        message: 'A little learning is a dangerous thing.'
      }
    );
  });
});

test('commenting is disabled', function (t) {
  t.plan(1);

  addComment({
    "user": "58bd8386fafd1045a0eeff98",
    "postSlug": "youth-is-wasted-on-the-young",
    "message": "A little learning is a dangerous thing."
  }).then(
    () => t.fail(),
    (e) => {
      t.ok(/Commenting is disabled/.test(e.message));
    }
  );
});

test('not allowed to comment', function (t) {
  t.plan(1);

  addComment({
    "user": "58bd83a3267fb214e8e03b74",
    "postSlug": "never-trust-a-skinny-cook",
    "message": "A little learning is a dangerous thing."
  }).then(
    () => t.fail(),
    (e) => {
      t.ok(/not allowed to comment/.test(e.message));
    }
  );
});

test('post not found', function (t) {
  t.plan(1);

  addComment({
    "user": "58bd83a3267fb214e8e03b74",
    "postSlug": "some-removed-post",
    "message": "A little learning is a dangerous thing."
  }).then(
    () => t.fail(),
    (e) => {
      t.ok(/object was not found/.test(e.message));
    }
  );
});
