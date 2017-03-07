const test = require('tape');
const find = require('../../utility/find');

// simple storage for posts
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
  }
];

// simple storage for users
const users = [
  {
    "id": "58bd8386fafd1045a0eeff98",
    "isAllowedToComment": true
  },
  {
    "id": "58bd83a3267fb214e8e03b74",
    "isAllowedToComment": false
  }
];


// this function will just find a post corresponding to the id and return it
function isCommentingEnabled(id) {
  try {
    const post = find(posts, 'id', id);
    return Promise.resolve(post.isCommentingEnabled);
  } catch (e) {
    return Promise.reject(e);
  }
}

// this function accepts the id of the user and a post object and checks if
// the user is allowed to write a comment to the given post
function isUserAllowedToComment(userId) {
  try {
    const user = find(users, 'id', userId);
    return Promise.resolve(user.isAllowedToComment);
  } catch (e) {
    return Promise.reject(e);
  }
}

// fakes an insert operation into the database
// return the "new" record
function insertComment(postId, userId, message) {
  return Promise.resolve({
    "record": {
      "id": "58bd80ca22d44764e4bb6dfc",
      "post": postId,
      "user": userId,
      "message": message
    }
  });
}

// this is the core function
function addComment(comment) {
  return Promise.all([
    isCommentingEnabled(comment.post),
    isUserAllowedToComment(comment.user)
  ]).then(([commentingEnabled, userCanComment]) => {
    if (commentingEnabled === false) {
      return Promise.reject(new Error('Commenting is disabled.'));
    }

    if (userCanComment === false) {
      return Promise.reject(new Error('The user is not allowed to comment on this post.'));
    }

    return insertComment(comment.post, comment.user, comment.message);
  }).then((result) => {
    return result.record;
  });
}

// lets test the different possibilies

test('happy path', function (t) {
  t.plan(1);

  addComment({
    "user": "58bd8386fafd1045a0eeff98",
    "post": "58bd800fec4f585c09b004ec",
    "message": "A little learning is a dangerous thing."
  }).then(
    (result) => {
      t.deepEqual(
        result,
        {
          id: '58bd80ca22d44764e4bb6dfc',
          post: '58bd800fec4f585c09b004ec',
          user: '58bd8386fafd1045a0eeff98',
          message: 'A little learning is a dangerous thing.'
        }
      );
    },
    (e) => {
      t.fail(e.message);
    }
);
});

test('commenting is disabled', function (t) {
  t.plan(1);

  addComment({
    "user": "58bd8386fafd1045a0eeff98",
    "post": "58bd812fec3f585c09b005aa",
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
    "post": "58bd800fec4f585c09b004ec",
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
    "post": "not1existing2id3here",
    "message": "A little learning is a dangerous thing."
  }).then(
    () => t.fail(),
    (e) => {
      t.ok(/object was not found/.test(e.message));
    }
  );
});
