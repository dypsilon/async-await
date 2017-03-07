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
function isCommentingEnabled(id, cb) {
  try {
    const post = find(posts, 'id', id);
    cb(null, post.isCommentingEnabled);
  } catch (e) {
    cb(e);
  }
}

// this function accepts the id of the user and a post object and checks if
// the user is allowed to write a comment to the given post
function isUserAllowedToComment(userId, cb) {
  try {
    const user = find(users, 'id', userId);
    return cb(null, user.isAllowedToComment);
  } catch (e) {
    cb(e);
  }
}

// fakes an insert operation into the database
// return the "new" record
async function insertComment(postId, userId, message, cb) {
  return cb(null, {
    "record": {
      "id": "58bd80ca22d44764e4bb6dfc",
      "post": postId,
      "user": userId,
      "message": message
    }
  });
}

// this is the core function
function addComment(comment, reply) {
  let replyCalled = false;
  let proceedCounter = 0;

  function replyOnce(err, result) {
    if (!replyCalled) {
      replyCalled = true;
      reply(err, result);
    }
  }

  isCommentingEnabled(comment.post, (err, enabled) => {
    if (err) return replyOnce(err)
    if (!enabled) return replyOnce(new Error('Commenting is disabled.'));

    return proceed();
  });

  isUserAllowedToComment(comment.user, (err, result) => {
    if (err) return replyOnce(err)
    if (!result) {
      return replyOnce(
        new Error('The user is not allowed to comment on this post.')
      );
    }

    return proceed();
  });

  function proceed() {
    proceedCounter++;

    if (proceedCounter == 2) {
      // this will run after both function above are finnished
      insertComment(comment.post, comment.user, comment.message, (err, result) => {
        if (err) return reply(err);

        return replyOnce(null, result.record);
      });
    }
  }
}


// lets test the different possibilies

test('happy path', function (t) {
  t.plan(1);

  addComment({
    "user": "58bd8386fafd1045a0eeff98",
    "post": "58bd800fec4f585c09b004ec",
    "message": "A little learning is a dangerous thing."
  }, (err, result) => {
    if (err) return t.fail(err.message);
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
    "post": "58bd812fec3f585c09b005aa",
    "message": "A little learning is a dangerous thing."
  }, (err, result) => {
    if (!err) return t.fail();

    t.ok(/Commenting is disabled/.test(err.message));
  });
});

test('not allowed to comment', function (t) {
  t.plan(1);

  addComment({
    "user": "58bd83a3267fb214e8e03b74",
    "post": "58bd800fec4f585c09b004ec",
    "message": "A little learning is a dangerous thing."
  }, (err, result) => {
    if (!err) return t.fail();
    t.ok(/not allowed to comment/.test(err.message));
  });
});

test('post not found and reply is called only once', function (t) {
  t.plan(1);

  addComment({
    "user": "58bd83a3267fb214e8e03b74",
    "post": "not1existing2id3here",
    "message": "A little learning is a dangerous thing."
  }, (err, result) => {
    if (!err) return t.fail();
    t.ok(/object was not found/.test(err.message));
  });
});
