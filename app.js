const express = require('express');
const app = express();
const bp = require('body-parser')
const ejs = require('ejs');
var mysql = require('mysql');
var session = require('express-session');
var path = require('path');
var multer = require('multer');
var queue = require('queue')
const fs = require("fs");
const DIR = './public/uploads';
var dateFormat = require('dateformat');
var date = require('date-and-time');
var xdate = require('x-date');
var nodemailer = require('nodemailer');
var moment = require('moment');
var jquery = require('jquery');

function Queue() {
  var a = [];

  this.getLength = function() {
    return a.length
  };
  this.list = function() {
    return a
  };
  this.isEmpty = function() {
    return 0 == a.length
  };
  this.addemp = function(b) {
    if (a.includes(b) || false) {
      this.addemp(++b);
    } else {
      a.push(b)
    }
  };
  this.popid = function(i) {
    var index = a.indexOf(i);
    if (index > -1) {
      a.splice(index, 1);
    }
  };
  this.popemp = function() {
    if (0 != a.length) {
      var c = a[0];
      a.splice(0, 1);
      return c;
    }
  };
  this.peek = function() {
    var b = 0
    return 0 < a.length ? a[b] : void 0
  }
};


app.use(bp.urlencoded({
  extended: true
}));

let storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, DIR);
  },
  filename: function(req, file, cb) {
    var d = JSON.stringify(new Date().toISOString().replace(/T/, '').replace(/\..+/, ''));
    cb(null, file.originalname);
    console.log(file.originalname);
  }
});

let upload = multer({
  storage: storage
});


var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'tes'
});

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

app.set("view engine", "ejs");

app.use(express.static("public"));

var q = new Queue();
console.log(q.isEmpty());
console.log(q.list());
var i = 0;
var available = "yes";
var sql = "SELECT id FROM emp where available=?";
connection.query(sql, [available], function(err, result, fields) {
  if (err)
    throw err;
  else {
    console.log(result.length);
    while (i < result.length) {
      console.log(JSON.stringify(result[i].id));
      q.addemp(parseInt(result[i].id));
      console.log(q.list());
      i = i + 1;
    }
  }
});

console.log(q.list());
var item = q.peek();
console.log("peek :  " + item);

app.get("/", function(req, res) {
  res.render('home');


});

app.get('/userhome', function(req, resp) {

  resp.render("userhome");
});

app.get('/delemp', function(req, resp) {
  resp.render("delemp");
});

app.get('/adminfeed', function(req, resp) {
  resp.render("adminfeed");
});

app.get('/adminlogin', function(req, res) {
  res.render("adminlogin");
});

app.get('/re', function(req, resp) {
  var d = new Date();
  var n = d.getFullYear();
  connection.query("SELECT cmpno,EXTRACT(year FROM date_start) as year FROM complaints ORDER BY cmpno DESC LIMIT 1", function(error, result, fields) {
    if (result.length > 0) {
      console.log(result[0].cmpno);
      console.log(result[0].year);
      var oy = parseInt(result[0].year)
      if (n > oy) {
        var cmpno = parseInt(n + '0000');
        connection.query("INSERT INTO complaints (cmpno,fname,id,status,date_end) VALUES (?,?,?,?,?)", [cmpno, 'new_year', 0, 'completed', d], function(error, results, fields) {
          console.log(error);
          if (results.length > 0) {
            console.log("successfully added new year");
          }
        })
      }
    }
  })
  resp.render("re");
});

app.get('/find', function(req, resp) {
  resp.render("find");
});

app.get('/track', function(req, resp) {
  resp.render("track");
});

app.get("/retdata", function(req, res) {
  res.render("retdata");
});

app.get("/retdata", function(req, res) {
  res.render("retdata");
});

app.get("/changeemp", function(req, res) {
  connection.query('SELECT * FROM complaints where status=? or status=? order by status ', ['not completed', 'not assigned'], function(error, result, fields) {
    connection.query('SELECT * FROM emp where available=?', ['yes'], function(err, resu, fields) {
      if ((!error) && (!err)) {
        res.render("changeemp", {
          result: result,
          res: resu
        });
      }
    });
  });
});


app.get("/feedback", function(req, res) {
  res.render("feedback");
});

app.get("/feedback1/:cmpno", function(req, res) {
  console.log(req.params.cmpno);
  res.render("feedback1", {
    cmpno: req.params.cmpno
  });
});

app.get("/errmsg", function(req, res) {
  res.render("errmsg");
});

app.get("/service", function(req, res) {
  res.render("service");
});

app.get("/emplogin", function(req, res) {
  res.render("emplogin");
});

app.get("/failure", function(req, res) {
  res.send("err");
});

app.get("/empsignup", function(req, res) {
  res.render("empsignup");
});
app.get("/check", (req, resp) => {
  var ids = [];
  var comp = [];
  var completed = [];
  var nc = [];
  var rejected = [];
  var rating = [];
  var diff = [];
  var names = [];
  var comp1 = [];
  var ids1 = [];
  var rating1 = [];
  var diff1 = [];
  var oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  console.log("oneweekago", oneWeekAgo);

  function store(callback) {
    var sql5 = "SELECT id,cmp,rating,TIMESTAMPDIFF(hour,date_start,date_end) AS diff  FROM complaints WHERE status='completed' AND date_start>? GROUP BY id,cmp";
    connection.query(sql5, [oneWeekAgo], function(err, result5, fields) {
      if (err)
        throw err;
      else {
        console.log(JSON.stringify(result5));
        lis = result5
      }
      var sql6 = "SELECT id,COUNT( CASE WHEN `status` like 'completed'  then 1 END) AS completed, COUNT( CASE WHEN `status` like 'not completed' then 1 END) AS nc,COUNT( CASE WHEN `status` like 'rejected' then 1 END) AS rejected from `complaints`  where id in (SELECT id from emp ) GROUP by id"
      connection.query(sql6, function(err, result6, fields) {
        if (err)
          throw err;
        else {
          console.log('result six');
          console.log('\n\n');
          console.log(JSON.stringify(result6));
          lis1 = result6
        }
        var sql7 = "SELECT name from emp"
        connection.query(sql7, function(err, result7, fields) {
          if (err)
            throw err;
          else {
            console.log(JSON.stringify(result7));
            lis2 = result7;
          }
          callback();

        });

      });
    });
  }

  function rend() {
    var lengthnew = lis.length;
    //  console.log(lis);
    for (var el in lis) {
      var obj = lis[el];
      ids1.push(obj.id);
      comp.push(obj.cmp);
      rating.push(obj.rating);
      diff.push(obj.diff);
    }
    for (var el1 in lis1) {
      var obj1 = lis1[el1];
      ids.push(obj1.id);
      completed.push(obj1.completed);
      nc.push(obj1.nc);
      rejected.push(obj1.rejected);
    }
    for (var el2 in lis2) {
      var obj2 = lis2[el2];
      names.push(obj2.name);

    }

    comp1 = comp;
    rating1 = rating;
    diff1 = diff;

    console.log("ids1", ids1)
    console.log("comp1", comp1)
    console.log("ratin1", rating1)
    console.log("diff1", diff1)
    console.log(names)
    console.log(completed)
    console.log("nc", nc)
    console.log(rejected);



    //  console.log(JSON.stringify(lis['id']));
    resp.render("disp", {
      ids: ids,
      ids1: ids1,
      comp1: comp1,
      rating1: rating1,
      diff1: diff1,
      names: names,
      completed: completed,
      nc: nc,
      rejected: rejected
    });
  }

  console.log(4);
  store(rend)
  console.log(5);

});
var transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'dhanusha.pathakota@gmail.com',
    pass: 'saradagiri'
  }
});


app.post("/empauth", (req, resp) => {
  var id = req.body.id;
  var status = "not completed";
  var password = req.body.password;
  if (id && password) {
    connection.query('SELECT * FROM emp WHERE id = ? AND password = ?', [id, password], function(error, result, fields) {
      if (result.length > 0) {
        req.session.emplogedin = true;
        req.session.empid = id;
        connection.query('SELECT * FROM complaints where id= ? and status = ?', [id, status], function(error, results, fields) {
          if (results.length == 0) {
            resp.render("response", {
              response: "No active task"
            });

          } else {
            var posts = results;
            var keys = Object.keys(posts);
            var arr = [];
            console.log(JSON.stringify(results) + "\n");
            console.log(keys + "\n");

            for (var i = 0; i < keys.length; i++) {
              var k = keys[i];
              arr[i] = posts[k];
            }
            console.log(keys);
            console.log(arr);
            resp.render("retdata", {
              list: arr
            });
          }

        });
      } else {
        resp.render("response", {
          response: "You are not a registered employee"
        });
      }
    });
  } else {
    resp.render("response", {
      response: "Please enter Username and Password!"
    });
    resp.end();
  }
});


app.post("/empauth1", (req, resp) => {
  var id = req.body.id;
  var name = req.body.name;
  var phoneno = req.body.phoneno;
  var password = req.body.password;
  var email = req.body.email;
  if (id && name && password && email && phoneno) {
    var sql = "INSERT INTO emp (id,name,email,phoneno,password) VALUES (?,?,?,?,?)";
    connection.query(sql, [id, name, email, phoneno, password], function(error, results, fields) {
      if (error) {
        console.log(error);
        resp.render("response", {
          response: "Employee already present"
        });
      } else {
        resp.render("response", {
          response: "Emp added successfully"
        });
      }
      resp.end();
    });
    var sql1 = "SELECT cmpno,cmp,status FROM complaints WHERE status='not assigned'";
    connection.query(sql1, function(error, results1, fields) {
      if (results1.length > 0) {
        cmpno = results1[0].cmpno;
        connection.query('UPDATE complaints SET status="not completed",id=? WHERE cmpno=?', [id, cmpno], function(err, result) {
          if (err)
            throw err;

        });
        connection.query('UPDATE emp SET available="onduty" WHERE id=?', [id], function(err, result) {
          if (err)
            throw err;

        });
      } else {
        q.addemp(id);
      }

    });
  } else {
    resp.send('Please enter all credentials!');
    resp.end();
  }
});

app.post("/deleteemp", (req, resp) => {
  var name = req.body.name;
  var id;
  var d = new Date().format('yyyy-mm-dd HH:MM:ss')
  if (name) {
    var sql = "SELECT * FROM emp WHERE name='" + name + "'";
    connection.query(sql, function(error, result, fields) {
      if (result.length > 0) {
        id = result[0].id;
        console.log(result[0].id);
        var sql = "DELETE FROM emp WHERE name='" + name + "'";
        connection.query(sql, function(error, results) {
          if (error)
            throw error;
          else {
            connection.query('update complaints set id=0,status=?,date_start=? where id=? and status=?', ['not assigned', d, id, 'not completed'], function(error, result, fields) {
              if (error)
                throw error;
              resp.render("response", {
                response: "Emp deleted successfully"
              });
            });
          }
        });
      } else {
        resp.render("response", {
          response: "Emp not found"
        });
      }
    });
  } else {
    resp.render("response", {
      response: "enter all credentials"
    });
  }
});


app.post("/tracking", (req, resp) => {
  var id = req.body.id;

  if (id) {
    var sql = "SELECT status FROM complaints WHERE cmpno='" + id + "'";
    connection.query(sql, function(error, result, fields) {
      if (result.length > 0) {
        resp.render("response", {
          response: ("status:" + " " + JSON.stringify(result[0].status))
        });;
      } else {
        resp.render("response", {
          response: "This tracking id doesn't exit.! Check and enter your id once again"
        });
      }

    });
  } else {
    resp.render("response", {
      response: "Please enter the tracking id"
    });
  }
});


app.post("/cmpform", upload.single('up_image'), (req, resp) => {

  var fname = req.body.fname;
  var subject = req.body.subject;
  var cmp = req.body.cmp;
  var email = req.body.email;
  var filename;
  var d = new Date();
  var n = d.getFullYear();
  var sql = "SELECT max(cmpno) FROM complaints";
  connection.query(sql, function(error, result, fields) {
    if (result.length > 0) {
      console.log(result);
    }
  });
  req.session.fname = fname;
  req.session.subject = subject;
  req.session.cmp = cmp;
  req.session.email = email;
  try {
    filename = req.file.filename;
    //console.log("//////"+filename);
    req.session.filename = filename;
    console.log("img name: " + req.file.filename + ".........");
    console.log("img name: " + req.session.filename + ".........");
    if (!(filename)) {
      console.log("no attachments");
      throw "no attachments";
    }
  } catch (e) {
    console.log("caught" + e);
    filename = '';
    req.session.filename = ''
  }

  if (fname && subject && cmp && email) {


    resp.render("token", {
      t1: fname,
      t2: email,
      t3: subject,
      t4: cmp,
      img: filename
    });


  } else {
    resp.render("response", {
      response: "Please enter all details!"
    });
    resp.end();
  }

});


app.get("/cmpform1", upload.single('up_image'), (req, resp) => {
  console.log("abcd");
  var fname = req.session.fname;

  var subject = req.session.subject;
  var cmp = req.session.cmp;
  var email = req.session.email;
  console.log("session:::::::::::::" + req.session.filename);
  var filename;
  console.log("eeee", fname, subject, cmp, email, filename);
  var empid = 0;
  var status = 'not assigned'
  try {
    filename = req.session.filename;
    console.log("img name 2nd part");
    console.log("img name: " + req.session.filename + "..............." + filename);
    console.log(filename);
    if (!(filename)) {
      console.log("no attachments");
      throw "no attachments";
    }
  } catch (e) {
    console.log("caught");
    filename = '';
  }
  if (!q.isEmpty()) {
    empid = q.popemp();
    console.log(q.list());
    status = 'not completed';
  }
  if (fname && subject && cmp && email) {

    var sql = "INSERT INTO complaints (fname,email,subject,cmp,image,id,status) VALUES (?,?,?,?,?,?,?)";
    connection.query(sql, [fname, email, subject, cmp, filename, empid, status], function(error, results, fields) {
      if (error) {
        console.log(error);
        resp.redirect("/failure");
      } else {
        console.log("hello cmp no is: " + JSON.stringify(results.insertId));

        resp.render("token1", {
          t1: fname,
          t2: email,
          t3: results.insertId
        });

        if (filename) {
          var mailOptions1 = {
            from: 'dhanusha.pathakota@gmail.com',
            to: email,
            subject: subject,
            text: (fname + '\n' + email + '\n' + subject + '\n' + cmp + "!"),

            attachments: [{
              filename: filename,
              path: './public/uploads/' + filename
            }]
          };
        } else {
          var mailOptions1 = {
            from: 'dhanusha.pathakota@gmail.com',
            to: email,
            subject: subject,
            text: (fname + '\n' + email + '\n' + subject + '\n' + cmp + "!"),
          };
        }

        transporter.sendMail(mailOptions1, function(error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
      }
      resp.end();
    });
    var sql1 = "UPDATE emp SET available='onduty' WHERE id='" + empid + "'";
    connection.query(sql1, function(err, result1, fields) {
      if (err)
        throw err;

    });
  } else {
    resp.render("response", {
      response: "Please enter aall details!"
    });
    resp.end();
  }

});


app.post("/completed", (req, resp) => {
  var empid = req.session.empid;
  var status = "not completed";
  var d = new Date().format('yyyy-mm-dd HH:MM:ss')
  var sql5 = "UPDATE emp SET available='yes' WHERE id='" + empid + "'";
  connection.query(sql5, function(err, result5, fields) {
    if (err)
      throw err;
  });


  connection.query("UPDATE complaints SET date_end='" + d + "' WHERE id= '" + empid + "' and status = '" + status + "'", function(error, results, fields) {

    if (error)
      throw error;

    if (results.changedRows > 0) {
      connection.query("SELECT email,cmpno FROM complaints WHERE id= '" + empid + "' and status = '" + status + "'", function(error, results, fields) {
        if (error)
          throw error;
        else {
          console.log(results[0].email);
          var el = JSON.stringify(results[0].email);
          var cmpno = parseInt(JSON.stringify(results[0].cmpno));
          var subject = "feedback form";
          console.log("main is:" + el);

          var mailOptions9 = {
            from: 'dhanusha.pathakota@gmail.com',
            to: el,
            subject: subject,
            text: 'http://localhost:8080/feedback1/' + cmpno
          };
          transporter.sendMail(mailOptions9, function(error, info) {
            if (error) {
              console.log("error" + error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
        }
      });

      connection.query('UPDATE complaints SET status="completed" WHERE id = ?', [empid], function(error, result, fields) {
        if (result.changedRows > 0) {
          q.addemp(parseInt(empid));
          connection.query("select cmpno,status from complaints where status='not assigned'", function(error, result1, fields) {
            if (!(result1.length > 0)) {

              console.log("empp added");
              console.log(q.list());
              resp.render("response", {
                response: "Good Job!! \n wait for any new task "
              });
            } else {
              console.log("inside else");
              console.log(q.list() + "queue part");
              console.log(q.isEmpty() + "queue part");
              if (!q.isEmpty()) {
                var cmpno = parseInt(result1[0].cmpno);
                console.log(cmpno);
                var sql1 = "UPDATE emp SET available='onduty' WHERE id='" + empid + "'";
                connection.query(sql1, function(err, result1) {
                  if (err)
                    throw err;

                });


                connection.query('UPDATE complaints SET status="not completed" , id=? WHERE cmpno = ?', [empid, cmpno], function(error, result2, fields) {
                  if (result2.changedRows) {}
                });
                q.popemp();
                resp.render("response", {
                  response: "Good Job!! YOU Have got new task please go back and check "
                });
              }
            }

          });
        } else {
          resp.render("response", {
            response: "you had no jobs to be completed \n wait for a task!!"
          });
        }
      });
    } else {
      resp.render("response", {
        response: "you had no jobs to be completed \n wait for a task!!"
      });
    }
  });
});

app.get("/completed_complaints", (req, resp) => {

  var fname = [];
  var subject = [];
  var cmp = [];
  var id = [];
  var date_start = [];
  var date_start1 = [];
  var status = [];
  var rating = [];
  var review = [];

  function convert(str) {
    const javaScriptRelease = Date.parse(str);
    var date = new Date(javaScriptRelease),
      mnth = ("0" + (date.getMonth() + 1)).slice(-2),
      day = ("0" + date.getDate()).slice(-2);
    return [day, mnth, date.getFullYear()].join("-");
    console.log("changed", [date.getFullYear(), mnth, day].join("-"));
  }




  function store(callback) {
    var sql5 = "SELECT fname,subject,cmp,id,date_start,status,rating,reviews  FROM complaints  WHERE status='completed'";
    connection.query(sql5, function(err, result5, fields) {
      if (err)
        throw err;
      else {
        console.log(JSON.stringify(result5));
        lis = result5
      }


      callback();

    });


  }

  function rend() {
    var lengthnew = lis.length;
    //  console.log(lis);
    for (var el in lis) {
      var obj = lis[el];
      fname.push(obj.fname);
      subject.push(obj.subject);
      cmp.push(obj.cmp);
      id.push(obj.id);
      date_start.push(obj.date_start);
      status.push(obj.status);
      rating.push(obj.rating);
      review.push(obj.review);

    }
    for (var el1 in date_start) {
      date_start1.push(convert(date_start[el1]));
      console.log("el1", el1);
    }



    console.log("fname", fname);
    console.log("subject", subject);
    console.log("cmp", cmp);
    console.log("id", id);
    console.log(date_start);
    console.log(date_start1);
    console.log(status);
    console.log(rating);
    console.log(review);



    //  console.log(JSON.stringify(lis['id']));
    resp.render("dispcompleted", {
      fname: fname,
      subject: subject,
      cmp: cmp,
      id: id,
      date_start1: date_start1,
      status: status,
      rating: rating,
      review: review
    });
  }

  console.log(4);
  store(rend)
  console.log(5);





});
app.get("/complaints_in_progress", (req, resp) => {
  var fname = [];
  var subject = [];
  var cmp = [];
  var id = [];
  var date_start = [];
  var date_start1 = [];
  var status = [];
  var rating = [];
  var review = [];

  function convert(str) {
    const javaScriptRelease = Date.parse(str);
    var date = new Date(javaScriptRelease),
      mnth = ("0" + (date.getMonth() + 1)).slice(-2),
      day = ("0" + date.getDate()).slice(-2);
    return [day, mnth, date.getFullYear()].join("-");
    console.log("changed", [date.getFullYear(), mnth, day].join("-"));
  }




  function store(callback) {
    var sql5 = "SELECT fname,subject,cmp,id,date_start,status,rating,reviews  FROM complaints  WHERE status='not completed'";
    connection.query(sql5, function(err, result5, fields) {
      if (err)
        throw err;
      else {
        console.log(JSON.stringify(result5));
        lis = result5
      }


      callback();

    });


  }

  function rend() {
    var lengthnew = lis.length;
    //  console.log(lis);
    for (var el in lis) {
      var obj = lis[el];
      fname.push(obj.fname);
      subject.push(obj.subject);
      cmp.push(obj.cmp);
      id.push(obj.id);
      date_start.push(obj.date_start);
      status.push(obj.status);
      rating.push(obj.rating);
      review.push(obj.review);

    }
    for (var el1 in date_start) {
      date_start1.push(convert(date_start[el1]));
      console.log("el1", el1);
    }



    console.log("fname", fname);
    console.log("subject", subject);
    console.log("cmp", cmp);
    console.log("id", id);
    console.log(date_start);
    console.log(date_start1);
    console.log(status);
    console.log(rating);
    console.log(review);



    //  console.log(JSON.stringify(lis['id']));
    resp.render("dispprogress", {
      fname: fname,
      subject: subject,
      cmp: cmp,
      id: id,
      date_start1: date_start1,
      status: status
    });
  }

  console.log(4);
  store(rend)
  console.log(5);



});

app.get("/listofcomplaint", (req, resp) => {
  var fname=[];
  var subject=[];
  var cmp=[];
  var id=[];
  var date_start=[];
  var date_start1=[];
  var status=[];
  var rating=[];
  var review=[];
  function convert(str) {
    const javaScriptRelease =Date.parse(str);
    var date = new Date(javaScriptRelease),
      mnth = ("0" + (date.getMonth() + 1)).slice(-2),
      day = ("0" + date.getDate()).slice(-2);
    return [day, mnth,date.getFullYear()].join("-");
    console.log("changed",[date.getFullYear(), mnth, day].join("-"));
  }
  
  
    
  
        function store(callback) {
        var sql5="SELECT * FROM complaints";
          connection.query(sql5, function(err, result5, fields) {
            if (err)
              throw err;
            else {
              console.log(JSON.stringify(result5));
              lis=result5
            }
  
      
            callback();
  
                  });
  
       
        }
      function rend() {
        var lengthnew=lis.length;
      //  console.log(lis);
        for (var el in lis) {
            var obj = lis[el];
            fname.push(obj.fname);
            subject.push(obj.subject);
            cmp.push(obj.cmp);
            id.push(obj.id);
            date_start.push(obj.date_start);
            status.push(obj.status);  
            rating.push(obj.rating);
            review.push(obj.reviews);
       
          }
          for (var el1 in date_start)
          {
            date_start1.push(convert(date_start[el1]));
            console.log("el1",el1);
          }
  
      
  
          console.log("fname",fname);
  console.log("subject",subject);
  console.log("cmp",cmp);
  console.log("id",id);
  console.log(date_start);
  console.log(date_start1);
  console.log(status);
  console.log(rating);
  console.log(review);
  
  
  
      //  console.log(JSON.stringify(lis['id']));
        resp.render("dispcomplaint",{fname:fname,subject:subject,cmp:cmp,id:id,date_start1:date_start1,status:status,rating:rating,review:review});
      }
  
      console.log(4);
      store(rend)
      console.log(5);
  
  });
  
  app.post("/feedback", (req, resp) => {
    var cmpnum;
    var empid = req.session.empid;
  
    var type = req.body.type;
    if (req.body.requirements) {
      var requirements = req.body.requirements;
    } else {
      console.log("else adding");
      requirements ="none" ;
    }
    console.log("fromform: " + requirements);
    var details = req.body.details;
    connection.query('SELECT * FROM complaints WHERE id = ?  and status="not completed"', [empid], async function(error, result, fields) {
      if (result.length > 0) {
        cmpnum = result[0].cmpno;
      } else {
  
        resp.write("<h1>ERROR</h1><h2>cant send feedback without a service</h2>", function(err) { resp.end(); });
      }
    });
    setTimeout(later, 30);
    function later(error) {
      if (empid && type && details) {
        var sql = "INSERT INTO empfeedback (cmpno,empid,type,details,requirements) VALUES (?,?,?,?,?)";
        console.log("after query: " + requirements);
        connection.query(sql,[cmpnum,empid,type,details,requirements], function(error, results, fields) {
          if (error) {
            console.log(error);
            resp.redirect("/failure")
  
          } else {
            resp.redirect("/emplogin")
          }
        });
      } else {
        resp.render("errmsg",{err:'Please enter all credentials!'})
      }
      if (error) {
          resp.render("errmsg",{err:'history.back()'})
      }
    }
  });
  
app.post("/feedback", (req, resp) => {
  var cmpnum;
  var empid = req.session.empid;

  var type = req.body.type;
  if (req.body.requirements) {
    var requirements = req.body.requirements;
  } else {
    console.log("else adding");
    requirements = void 0;
  }
  console.log("fromform: " + requirements);
  var details = req.body.details;
  connection.query('SELECT * FROM complaints WHERE id = ?  and status="not completed"', [empid], async function(error, result, fields) {
    if (result.length > 0) {
      cmpnum = result[0].cmpno;
    } else {
      resp.render("response", {
        response: "ERROR \n cant send feedback without a service"
      });
    }
  });
  setTimeout(later, 30);

  function later(error) {
    if (empid && type && details) {
      var sql = "INSERT INTO empfeedback (cmpno,empid,type,details,requirements) VALUES (?,?,?,?,?)";
      console.log("after query: " + requirements);
      connection.query(sql, [cmpnum, empid, type, details, requirements], function(error, results, fields) {
        if (error) {
          console.log(error);
          resp.redirect("/failure")

        } else {
          resp.redirect("/emplogin")
        }
      });
    } else {
      resp.render("errmsg", {
        err: 'Please enter all credentials!'
      })
    }
    if (error) {
      resp.render("errmsg", {
        err: 'history.back()'
      })
    }
  }
});


app.post("/rating", (req, resp) => {
  var rate = parseInt(req.body.rate);
  var review = req.body.review;
  var cmp = parseInt(req.body.cmp);
  console.log(cmp);
  var cmpno = cmp + 5;
  console.log("hi");
  console.log("rate:" + rate + " review:" + review + " cmpno " + cmp + " cmpnoo::" + cmpno);
  connection.query('UPDATE complaints SET rating=? , review=? WHERE cmpno=?', [rate, review, cmp], function(error, result, fields) {
    console.log("query" + JSON.stringify(result));
    if (result.affectedRows > 0) {
      console.log("in if");
      resp.render("response", {
        response: "Thank you for your rating"
      });
    } else if (error) {
      throw error;
    }
  });
});


app.get("/new_service", function(req, resp) {
  var oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  console.log(oneWeekAgo);

  connection.query('SELECT * FROM service_requests WHERE reg_date > ?', [oneWeekAgo], function(error, result, fields) {

    if (error) {
      console.log(error);
    } else {
      if (result.length > 0) {
        var l = result.length;
        console.log(l);
        var posts = result;
        var keys = Object.keys(posts);
        var arr = [];
        console.log(JSON.stringify(result) + "\n");
        console.log(keys + "\n");

        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          arr[i] = posts[k];
        }

        resp.render("service_final", {
          list: arr
        });

      } else {
        resp.render("response", {
          response: "no new request from past 1 week"
        });
      }
    }
  });
});


app.get("/adminconsole", function(req, resp) {
  var ids = [];
  var tim = [];
  var coor = [];
  var lenOftim = [];
  var avgTime = [];
  var avgRating = [];
  var empNames = [];
  var completed = [];
  var nc = [];
  var rejected = [];
  var total = [];

  function store(callback) {

    var sql5 = "SELECT emp.id,emp.name,AVG(rating) AS avgRating,GROUP_CONCAT(TIMESTAMPDIFF(HOUR,date_start,date_end)) AS diff  FROM complaints JOIN emp ON complaints.id=emp.id where status='completed' GROUP by emp.id";
    connection.query(sql5, function(err, result5, fields) {
      if (err)
        throw err;
      else {
        console.log(JSON.stringify(result5));
        lis = result5
      }


      var oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      console.log(oneMonthAgo);

      var sql6 = "SELECT id,COUNT(*) AS total,COUNT( CASE WHEN `status` like 'completed'  then 1 END) AS completed, COUNT( CASE WHEN `status` like 'not completed' then 1 END) AS nc,COUNT( CASE WHEN `status` like 'rejected' then 1 END) AS rejected from `complaints`  where id in (SELECT id from emp ) and date_start > ?"
      connection.query(sql6, [oneMonthAgo], function(err, result6, fields) {
        if (err)
          throw err;
        else {
          console.log(JSON.stringify(result6));
          lis1 = result6
        }

        callback();

      });
    });


  }

  function rend() {
    var lengthnew = lis.length;


    console.log(lis);
    for (var el in lis) {
      var obj = lis[el];
      var a = "Emp"
      console.log(a + 1);
      ids.push(a + obj.id);
      console.log(ids);

      tim.push((obj.diff).split(','));
      avgRating.push(obj.avgRating);
      empNames.push(obj.name);
    }
    for (var el1 in lis1) {
      var obj1 = lis1[el1];
      total.push(obj1.total)
      completed.push(obj1.completed);
      nc.push(obj1.nc);
      rejected.push(obj1.rejected);
    }

    console.log("avgR", avgRating);
    console.log("names", empNames);

    console.log("completed", completed);
    console.log("nc", nc);
    console.log("rejected", rejected);
    console.log("total", total);

    for (i = 0; i < tim.length; i = i + 1) {


      let c1 = [];

      for (j = 1; j <= tim[i].length; j = j + 1) {

        c1.push(a + j);
      }
      lenOftim.push(tim[i].length);

      coor.push(c1);
    }

    for (i = 0; i < tim.length; i = i + 1) {

      var sum = 0;
      for (j = 1; j <= tim[i].length; j = j + 1) {
        //console.log(tim[i][j-1]);
        sum += parseInt(tim[i][j - 1]);

      }
      avgTime.push(sum / lenOftim[i]);

    }
    console.log(avgTime);


    resp.render("admindisp", {
      avgTime: avgTime,
      ids: ids,
      avgRating: avgRating,
      empNames: empNames,
      total: total,
      completed: completed,
      nc: nc,
      rejected: rejected
    });
  }

  console.log(4);
  store(rend)
  console.log(5);
});

app.post("/adminauth", (req, resp) => {
  var id = req.body.username;
  var password = req.body.password;
  if (id == 123 && password == "admin") {
    resp.redirect("/adminconsole");
  } else {
    resp.redirect("/adminlogin");
  }
  resp.end()
});


app.post("/service_req", (req, resp) => {
  var cname = req.body.cname;
  var email = req.body.email;
  var phonno = req.body.phonno;
  var subject = req.body.subject;
  var details = req.body.details;

  console.log(cname);
  console.log(email);
  console.log(subject);
  console.log(details);
  if (cname && email && subject && details) {

    var sql = "INSERT INTO service_requests (cname,email,phno,subject,details) VALUES (?,?,?,?,?)";
    connection.query(sql, [cname, email, phonno, subject, details], function(error, results, fields) {
      if (error) {
        console.log(error);
        resp.redirect("/failure");
      } else {
        resp.render("response", {
          response: "thank you for choosing adhitya systems"
        });
      }

      resp.end();
    });
  } else {
    resp.render("response", {
      response: "please enter all credentials"
    });
    resp.end();
  }
});


app.get("/emp_fb", (req, resp) => {
  var reqts = []
  var cdj = []
  var others = []
  var cnp = []
  connection.query("SELECT * FROM empfeedback WHERE cmpno in(select cmpno from complaints where status ='not completed')", function(error, result, fields) {

    if (error) {
      console.log(error);
    } else {
      if (result.length > 0) {
        console.log('\n\n emp feedback');
        console.log(JSON.stringify(result));
        result.forEach((item, i) => {
          if (item.type == 'requirements')
            reqts.push(item)
          else if (item.type == 'cannot do job')
            cdj.push(item)
          else if (item.type == 'others')
            others.push(item)
          else if (item.type == 'customer not present')
            cnp.push(item)
        });



      } else {
        console.log("no new feedbacks from employess")
      }
      resp.render("adminfeed", {
        reqts: reqts,
        cdj: cdj,
        others: others,
        cnp: cnp
      })
    }
  });
});

app.post("/changeemp", (req, resp) => {
  var cmpno = req.body.cmpno;
  var empname = req.body.empname;
  var id;
  var ido;
  var d = new Date().format('yyyy-mm-dd HH:MM:ss')
  connection.query('select id from complaints where cmpno=?', [cmpno], function(error, result, fields) {
    if (result.length > 0) {
      ido = result[0].id;
      console.log(q.list());
      q.addemp(parseInt(result[0].id));
      connection.query('select id from emp where name=?', [empname], function(error, result, fields) {
        if (result.length > 0) {
          id = result[0].id;

          connection.query('UPDATE complaints,emp SET complaints.status=?,complaints.id=?,complaints.date_start=?,emp.available=? WHERE complaints.cmpno=? and emp.name=?', ['not completed', id, d, 'ond', cmpno, empname], function(error, result, fields) {
            if (!error) {
              //console.log("deeee",result);
              if (ido != 0) {
                connection.query('UPDATE emp set available=? where id=?', ['yes', ido], function(error, res, fields) {
                  if (!error) {
                    q.popid(parseInt(id));
                    resp.end("<h2><center>employee changed with current date as start date</center></h2>");
                    console.log(q.list());
                  }
                  if (error) {
                    resp.send(error)
                  }

                });
              }
              resp.render("response", {
                response: "Employee has been assigned to the job"
              });
            } else {
              resp.send(error)
            }
          });
        } else {

          resp.render("response", {
            response: "No such Employee exists"
          });
        }
      });
    } else {
      resp.render("response", {
        response: "Unable to assign the complaint to new Employee"
      });
    }

  });
});

app.post("/cancelcomplain", (req, resp) => {
  var cmpno = req.body.cmpno;
  var d = new Date().format('yyyy-mm-dd HH:MM:ss')
  var id;
  connection.query('select id from complaints where cmpno=?', [cmpno], function(error, result, fields) {
    if (result.length > 0) {
      id = result[0].id
      console.log(JSON.stringify(result[0].id));
      q.addemp(parseInt(result[0].id));
      console.log(q.list());
      connection.query('UPDATE emp,complaints SET complaints.status=?,complaints.date_end=?,emp.available=? where complaints.cmpno=? and emp.id=?', ['rejected', d, 'yes', cmpno, id], function(error, result, fields) {
        if (!error) {
          resp.render("response", {
            response: "The complaint has been rejected"
          });
          console.log(q.list());
        } else {
          resp.send(error)
        }
      });
    } else {
      {
        resp.render("response", {
          response: "No such complaint number"
        });
      }
    }
  });
});


const PORT = 3000;
app.listen(PORT, function() {
  console.log("Started");
});
