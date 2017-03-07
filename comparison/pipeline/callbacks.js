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
function fetchPostBySlug(slug, cb) {
  try { // notice that we dont have to handle this error in the async version
    return cb(null, find(posts, 'slug', slug));
  } catch (e) {
    return cb(e);
  }
}

// this function accepts the id of the user and a post object and checks if
// the user is allowed to write a comment to the given post
function isUserAllowedToComment(post, userId, cb) {
  let user = find(users, 'id', userId);

  try { // notice that we dont have to handle this error in the async version
    return cb(null, post.commentingAllowedFor.includes(user.role));
  } catch (e) {
    return cb(e);
  }
}

// fakes an insert operation into the database
// return the "new" record
function insertComment(postId, userId, message, cb) {
  return cb(null, {
    "record": {
      "id": "58bd80ca22d44764e4bb6dfc",
      "post": postId,
      "user": userId,
      "message": message
    }
  });
}

// this the actual core of the program
function addComment(comment, done) {
  fetchPostBySlug(comment.postSlug, (err, post) => {
    if (err) return done(err);

    if (!post.isCommentingEnabled) {
      return done(new Error('Commenting is disabled.'));
    }

    isUserAllowedToComment(post, comment.user, (err, isAllowed) => {
      if (err) return done(err);

      if (!isAllowed) {
        return done(
          new Error('The user is not allowed to comment on this post.')
        );
      }

      insertComment(post.id, comment.user, comment.message, (err, result) => {
        if (err) return done(err);

        return done(null, result.record);
      });
    });
  });
}

// lets test the different possibilies

test('happy path', function (t) {
  t.plan(1);

  addComment({
    "user": "58bd8386fafd1045a0eeff98",
    "postSlug": "never-trust-a-skinny-cook",
    "message": "A little learning is a dangerous thing."
  }, (err, result) => {
    if (err) return t.fail('Got an error.');

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
  }, (err, result) => {
    if (!err) return t.fail('Should return an error.');
    t.ok(/Commenting is disabled/.test(err.message));
  });
});

test('not allowed to comment', function (t) {
  t.plan(1);

  addComment({
    "user": "58bd83a3267fb214e8e03b74",
    "postSlug": "never-trust-a-skinny-cook",
    "message": "A little learning is a dangerous thing."
  }, (err, result) => {
    if (!err) return t.fail('Should return an error.');
    t.ok(/not allowed to comment/.test(err.message));
  });
});

test('post not found', function (t) {
  t.plan(1);

  addComment({
    "user": "58bd83a3267fb214e8e03b74",
    "postSlug": "some-removed-post",
    "message": "A little learning is a dangerous thing."
  }, (err, result) => {
    if (!err) return t.fail('Should return an error.');
    t.ok(/object was not found/.test(err.message));
  });
});
