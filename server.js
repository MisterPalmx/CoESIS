var mysql = require('mysql');
var express = require('express');
var async = require('async');
var bodyParser = require('body-parser');
var config = require('config')
var app = express();

console.log('Server is running on ' + (process.env.NODE_ENV || 'development') + ' mode')

var dbConfig = config.get('database'),
  appConfig = config.get('app');

app.listen(appConfig.port, () => {
  console.log('Server is listening on port ' + appConfig.port)
});

var conn = mysql.createPool({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  connectionLimit: dbConfig.connectionLimit
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

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
      connection.query('insert into student (id, nickname, name, gender, phone, phone2, address, facebook, registered) values (?, ?, ?, ?, ?, ?, ?, ?, now())', [id, nickname, name, gender, phone, phone2, address, facebook],
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
      event.password = (event.password != null) // Use boolean instead of showing password
      event.participants = [];
      participants.forEach((participant) => {
        if (participant.eventId == event.id)
          event.participants.push({
            studentId: participant.studentId,
            status: participant.status,
            remark: participant.remark,
            addtime: participant.addtime
          }); // Unnescessary to push eventId
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
    description = req.body.description,
    password = req.body.password;

  async.series([
    (callback) => {
      conn.getConnection((err, response) => {
        if (err) return callback(err);
        connection = response;
        callback();
      })
    },
    (callback) => {
      connection.query('insert into event (name, description, password, created) values (?, ?, ?, now())', [name, description, password],
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

app.post('/event/:id/update', (req, res) => {
  var connection,
    id = req.params.id,
    studentId = req.body.studentId,
    status = req.body.status,
    remark = req.body.remark,
    password = req.body.password;
  async.series([
    (callback) => {
      conn.getConnection((err, response) => {
        if (err) return callback(err);
        connection = response;
        callback();
      })
    },
    (callback) => {
      connection.query('select * from event where id = ?', [id],
        (err, response) => {
          if (err) return callback(err);
          if (!response.length) return callback('ไม่พบ Event ดังกล่าว');
          if (response[0].password && response[0].password != password) return callback('Password ไม่ถูกต้อง');
          callback();
        })
    },
    (callback) => {
      connection.query('insert into participant (eventId, studentId, status, remark, addtime) values (?, ?, ?, ?, now()) on duplicate key update status = ?, remark = ?', [id, studentId, status, remark, status, remark],
        (err, response) => {
          callback(err || null);
        });
    }
  ], (err) => {
    if (connection) connection.release();
    if (err) return res.json({
      success: false,
      message: err
    })
    console.log(studentId + ' update event#' + id + ' (status = ' + status + ', remark = ' + remark + ')')
    res.json({
      success: true
    })
  })
})
