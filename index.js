var http = require('http'),
  url = require('url'),
  querystring = require('querystring'),
  fs = require('fs'),
  _ = require('underscore'),
  S = require('string'),
  jade = require('jade'),
  JSZip = require('jszip'),
  xml2js = require('xml2js');

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

function dwnld_zip(host, path, cb) {
  var options = {
    host: host,
    port: 80,
    path: path,
    headers: {'user-agent': 'TV-Show Twitter Reminder (Dev) <mail@oliverfaircliff.com>'}
  };

  var req = http.get(options, function (res) {
    if (res.statusCode !== 200) {
      console.log("Response error: " + res.statusCode);
      return;
    }

    var data = [], dataLen = 0;

    // Collect the data.
    res.on('data', function(chunk) {
      data.push(chunk);
      dataLen += chunk.length;
    });

    res.on('end', function() {

      // Reform the data.
      var buf = new Buffer(dataLen);

      for (var i=0, len=data.length, pos=0; i < len; i++) {
        data[i].copy(buf, pos);
        pos += data[i].length;
      }
      // Unzip it
      var zip = new JSZip(buf);
      cb(zip);

    });
  });

  req.on('error', function(err) {
    console.log("Request error: " + err.message);
  });
}

function get_shows(cb) {
  var shows = [];

  dwnld_zip(
    'bleb.org',
    '/tv/data/listings?channels=' + channels.join(',') + '&days=0,1',
    (function (cb) { // Closure to get cb into the next callback.
      return function (zip) {
        var files = zip.files;

        // This function called after all async parseString functions done.
        var done = _.after(_(files).size(), function () {
          cb(shows);
        });

        // Loop through every file.
        _(files).each(function (file, filename) {
          if (file.dir) {
            // Don't care about directories.
            done();
            return;
          }

          // Extract JSON from the file.
          var xml = file.asText();
          xml2js.parseString(xml, function (err, res) {
            if (err) {
              console.log(err);
              done();
              return;
            }

            var channel = res.channel;

            // Date for all shows in this listing.
            var parts = channel['$'].date.split('/');
            //                  year,     month,      day       Month is 0-indexed
            var date = new Date(parts[2], parts[1]-1, parts[0]);

            // Loop through programmes on channel.
            _(channel.programme).each(function (show) {

              // Add show time to date.
              var show_date = new Date(date)
              show_date.setHours(S(show.start).left(2).toInt())
              show_date.setMinutes(S(show.start).right(2).toInt())

              shows.push({
                name: show.title[0],
                time: show_date,
                channel: channel['$'].id
              });
            });

            done();
          });
        });
      };
    })(cb)
  );
}

function get_JSON(name, cb) {
  fs.readFile(__dirname + '/' + name + '.json', 'utf8', function (err, data) {
    cb(JSON.parse(data));
  });
}

function tweet(users_due, reminder, shows) {
  _(shows).each(function (show) {
    _(users_due).each(function (user) {
      console.log(S(user).ensureLeft('@').s + ' ' + show.name + ' starts in ' + delays[reminder.delay]['human'] + ' on ' + show.channel + '. Don\'t miss it!');
    });
  });
}

function find_users(reminder_id, cb) {
  get_JSON('users', (function (reminder_id) {
    // Closure to pass reminder_id to call back.
    return function (users) {

      // Find all users with reminder_id set.
      var users_due = [];

      // Loop through all users.
      Object.keys(users).forEach(function (username) {
        var users_reminders = users[username]; // List of reminder_id's

        if (_(users_reminders).contains(S(reminder_id).toInt())) {
          users_due.push(username);
        }
      });

      cb(users_due);
    };
  })(reminder_id));
}

function find_due_reminders(shows, reminders) {
  var time = new Date().getTime(); // Now

  // Loop through reminders.
  _(reminders).each(function (reminder, reminder_id) {
    // Find all shows in listing for this reminder.
    var shows_for_reminder = _(shows).where({name: reminder.showName});

    // Filter to shows within 5m of now.
    var shows_to_remind = _(shows_for_reminder).filter(function (show) {
      // Find time reminder would be due for this show.
      var time_for_reminder = show.time.getTime() - delays[reminder.delay]['ms'];
      // If reminder is due within -5m and +5m of now.
      return (time - five_min < time_for_reminder &&
              time + five_min >= time_for_reminder);
    });

    if (_(shows_to_remind).size() > 0) {
      // Tweet them!
      find_users(reminder_id, function (users_due) {
        tweet(users_due, reminder, shows_to_remind);
      });
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
var channels; // Load our list of channels on startup.
get_JSON('channels', function (data) {
  channels = data;
  setInterval(main, 5*(ten_min/600));
});
