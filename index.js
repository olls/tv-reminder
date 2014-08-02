var http = require('http'),
  url = require('url'),
  querystring = require('querystring'),
  fs = require('fs'),
  jade = require('jade');

var users = {
  'olls96': [1, 4, 6, 3],
  'grit96': [3, 4, 5, 11, 14]
};

var reminders = {
  1: {
    showID: 123994,
    delay: 2
  },
  2: {
    showID: 123654,
    delay: '30m'
  },
  3: {
    showID: 121234,
    delay: '30m'
  },
  4: {
    showID: 123923,
    delay: '30m'
  },
  5: {
    showID: 654994,
    delay: '30m'
  },
  6: {
    showID: 234,
    delay: '10m'
  },
  7: {
    showID: 123994,
    delay: '1d'
  },
  8: {
    showID: 123654,
    delay: '30m'
  },
  9: {
    showID: 123994,
    delay: '30m'
  },
  10: {
    showID: 123994,
    delay: '30m'
  },
  11: {
    showID: 123994,
    delay: '30m'
  },
  12: {
    showID: 123994,
    delay: '30m'
  },
  13: {
    showID: 123994,
    delay: '30m'
  },
  14: {
    showID: 123994,
    delay: '30m'
  }
}

function contains(needle, haystack) {
  return haystack.indexOf(needle) > -1;
}

function find_users(reminder_id) {
  var users_due = [];

  Object.keys(users).forEach(function (username) {
    var users_reminders = users[username];

    if (contains(parseInt(reminder_id), users_reminders)) {
      users_due.push(username);
    }
  });

  return users_due;
}

function get_shows(cb) {
  cb([
    {
      name: 'Mythbusters',
      showID: 123994,
      time: 10
    }
  ]);
}

function tweet(users_due, reminder_id, show) {
  var reminder = reminders[reminder_id];
  console.log(users_due, show.name + ' starts in ' + reminder.delay + ' at ' + show.time + '. Don\'t miss it!');
}

function time() {
  return 8
}

setInterval(
  function () {
    get_shows(function (shows) {

      Object.keys(reminders).forEach(function (reminder_id) {
        var reminder = reminders[reminder_id];

        shows.forEach(function (show) {
          if (reminder.showID == show.showID
            && time() + reminder.delay == show.time) {

            users_due = find_users(reminder_id);
            tweet(users_due, reminder_id, show);
          }
        });

      });

    });
  }, 1000*5// * 60 * 10 // 1000ms * 60s * 10m
);

// var app = http.createServer(function(request, response) {

//   var url_parts = url.parse(request.url, true)
//   var path = url_parts.pathname.replace(/^\/|\/$/g, '');

// });