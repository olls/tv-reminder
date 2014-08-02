var http = require('http'),
  url = require('url'),
  querystring = require('querystring'),
  fs = require('fs'),
  _ = require('underscore'),
  jade = require('jade');

var one_min = 1000 * 60;
var five_min = one_min * 5;
var ten_min = one_min * 10;

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

function get_shows(cb, reminders) {
  cb({
    123994: {
      name: 'Mythbusters',
      time: t
    },
    123654: {
      name: 'BBC News',
      time: t2
    }
  });
}

function get_JSON(name, cb) {
  fs.readFile(__dirname + '/' + name + '.json', 'utf8', function (err, data) {
    cb(JSON.parse(data));
  });
}

function tweet(users_due, reminder, show) {
  console.log(users_due, show.name + ' starts in ' + delays[reminder.delay]['human'] + ' at ' + show.time + ' on ' + show.channel + '. Don\'t miss it!');
}

function find_users(reminder_id) {
  get_JSON('users', function (users) {

    // Find all users with reminder_id set.
    var users_due = [];
    var reminder_id = parseInt(reminder_id);

    // Loop through all users.
    Object.keys(users).forEach(function (username) {
      var users_reminders = users[username]; // List of reminder_id's

      if (_(users_reminders).contains(reminder_id)) {
        users_due.push(username);
      }
    });

    return users_due;
  });
}

function find_due_reminders(shows, reminders) {
  var time = new Date(); // Now

  // Loop through reminders.
  Object.keys(reminders).forEach(function (reminder_id) {
    var reminder = reminders[reminder_id];

    if (_(shows).has(reminder.showID)) {

      var show = shows[reminder.showID];
      var delayed_time = show.time.getTime() - delays[reminder.delay]['ms'];

      // If reminder is due within -5m and +5m of now.
      if (time.getTime() - five_min < delayed_time &&
          time.getTime() + five_min >= delayed_time) {

        // Tweet them!
        users_due = find_users(reminder_id);
        tweet(users_due, reminder, show);
      }
    }
  });
}

function main() {

  // Get reminders and listings JSON.
  var shows;
  var reminders;

  // Run both requests async.
  var done = _.after(2, function () {
    find_due_reminders(shows, reminders);
  });

  get_shows(function (data) {
    shows = data;
    done();
  });

  get_JSON('reminders', function (data) {
    reminders = data;
    done();
  });

}

// Every 10m download listings for today and tomorrow, check for shows in
//  reminders also in listings which are due reminders.
setInterval(main, 5*(ten_min/600));
