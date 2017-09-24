var mysql = require('mysql');
var express = require('express');
var async = require('async');
var bodyParser = require('body-parser');
var app = express();

app.listen(5000);
console.log('Server is running on http://localhost:5000')

var conn = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'CoESIS',
  connectionLimit: 10
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type');
	res.setHeader('Access-Control-Allow-Credentials', true);
	req.ipv4 = req.headers['x-real-ip'] || req.headers['x-client-ip'] || req.headers['x-forwarded-for'] || '127.0.0.1';
	next();
});

app.get('/student', (req, res) => {
  var connection,
    students = [];
  async.series([
    (callback) => {
      conn.getConnection((err, response) => {
        if (err) return callback(err);
        connection = response;
        callback();
      })
    },
    (callback) => {
      connection.query('select * from student', (err, response) => {
        if (err) return callback(err);
        students = response;
        callback();
      })
    }
  ], (err) => {
    if (connection) connection.release();
    if (err) return res.json({
      success: false,
      message: err
    })
    res.json({
      success: true,
      data: {
          students: students
      }
    })
  })
})

app.post('/student/new', (req, res) => {
  var connection,
    id = req.body.id,
    nickname = req.body.nickname,
    name = req.body.name,
    gender = req.body.gender,
    phone = req.body.phone,
    phone2 = req.body.phone2,
    address = req.body.address,
    facebook = req.body.facebook;

  async.series([
    (callback) => {
      conn.getConnection((err, response) => {
        if (err) return callback(err);
        connection = response;
        callback();
      })
    },
    (callback) => {
      connection.query('insert into student (id, nickname, name, gender, phone, phone2, address, facebook, registered) values (?, ?, ?, ?, ?, ?, ?, ?, now())',
      [ id, nickname, name, gender, phone, phone2, address, facebook ],
      (err, response) => {
        if (err) return callback(err);
        callback();
      })
    }
  ], (err) => {
    if (connection) connection.release();
    if (err) return res.json({
      success: false,
      message: err
    })
    res.json({
      success: true
    })
  })
})

// app.get('/student/:id', (req, res) => {
//   var connection,
//     id = req.params.id,
//     student = {};
//   async.series([
//     (callback) => {
//       conn.getConnection((err, response) => {
//         if (err) return callback(err);
//         connection = response;
//         callback();
//       })
//     },
//     (callback) => {
//       connection.query('select * from student where id = ' + mysql.escape(id), (err, response) => {
//         if (err) return callback(err);
//         student = response[0];
//         callback();
//       })
//     }
//   ], (err) => {
//     if (connection) connection.release();
//     if (err) return res.json({
//       success: false,
//       message: err
//     })
//     res.json({
//       success: true,
//       data: {
//           student: student
//       }
//     })
//   })
// })

app.get('/event', (req, res) => {
  var connection,
    events = [],
    participants = [];

  async.series([
    (callback) => {
      conn.getConnection((err, response) => {
        if (err) return callback(err);
        connection = response;
        callback();
      })
    },
    (callback) => {
      async.parallel([
        (callback) => {
          connection.query('select * from event', (err, response) => {
            if (err) return callback(err);
            events = response;
            callback();
          })
        },
        (callback) => {
          connection.query('select * from participant', (err, response) => {
            if (err) return callback(err);
            participants = response;
            callback();
          })
        }
      ], callback);
    }
  ], (err) => {
    if (connection) connection.release();
    if (err) return res.json({
      success: false,
      message: err
    })
    events.forEach((event) => {
      event.participants = [];
      participants.forEach((participant) => {
        if (participant.event_id == event.id)
          event.participants.push({
            student_id: participant.student_id,
            status: participant.status,
            remark: participant.remark,
            addtime: participant.addtime
          }); // Unnescessary to push event_id
      })
    })
    res.json({
      success: true,
      data: {
          events: events
      }
    })
  })
})


app.post('/event/new', (req, res) => {
  var connection,
    name = req.body.name,
    description = req.body.description;

  async.series([
    (callback) => {
      conn.getConnection((err, response) => {
        if (err) return callback(err);
        connection = response;
        callback();
      })
    },
    (callback) => {
      connection.query('insert into event (name, description, created) values (?, ?, now())',
      [ name, description ],
      (err, response) => {
        if (err) return callback(err);
        callback();
      })
    }
  ], (err) => {
    if (connection) connection.release();
    if (err) return res.json({
      success: false,
      message: err
    })
    res.json({
      success: true
    })
  })
})
