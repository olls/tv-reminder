var http = require('http'),
  url = require('url'),
  querystring = require('querystring'),
  fs = require('fs'),
  jade = require('jade');

var one_min = 1000 * 60;
var five_min = one_min * 5;
var ten_min = one_min * 10;

var users = {
  'olls96': [1, 4, 6, 3],
  'grit96': [3, 4, 5, 11, 14]
};

var reminders = {
  1: {
    showID: 123994,
    delay: '10m'
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

var delays = {
  '1d': {
    'ms': one_min * 60 * 24,
    'human': 'a day'
  },
  '12h': {
    'ms': one_min * 60 * 12,
    'human': '12 hours'
  },
  '6h': {
    'ms': one_min * 60 * 6,
    'human': '6 hours'
  },
  '3h': {
    'ms': one_min * 60 * 3,
    'human': '3 hours'
  },
  '1h': {
    'ms': one_min * 60,
    'human': 'an hour'
  },
  '30m': {
    'ms': one_min * 30,
    'human': 'half an hour'
  },
  '20m': {
    'ms': one_min * 20,
    'human': '20 minutes'
  },
  '10m': {
    'ms': one_min * 10,
    'human': '10 minutes'
  }
}

function contains(needle, haystack) {
  return haystack.indexOf(needle) > -1;
}

var t = new Date();
t.setMinutes(t.getMinutes() + 16)
function get_shows(cb) {
  cb([
    {
      name: 'Mythbusters',
      showID: 123994,
      time: t
    }
  ]);
}

function tweet(users_due, reminder_id, show) {
  var reminder = reminders[reminder_id];
  console.log(users_due, show.name + ' starts in ' + delays[reminder.delay]['human'] + ' at ' + show.time + '. Don\'t miss it!');
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

function main() {

  // Every 10m download listings for today and tomorrow, check for shows in
  //  reminders also in listings which are due reminders.
  setInterval(
    function () {
      get_shows(function (shows) {
        var time = new Date();

        // Loop through reminders
        Object.keys(reminders).forEach(function (reminder_id) {
          var reminder = reminders[reminder_id];

          shows.forEach(function (show) {
            var delayed_time = show.time.getTime() - delays[reminder.delay]['ms'];

            // If shows match and reminder is due within -5m and +5m
            if (reminder.showID == show.showID &&
                time.getTime() - five_min < delayed_time &&
                time.getTime() + five_min >= delayed_time) {

              users_due = find_users(reminder_id);
              tweet(users_due, reminder_id, show);
            }
          });

        });

      });
    }, ten_min
  );
}

main();
