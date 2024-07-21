const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const moment = require('moment');
require('dotenv').config();

//connect to database
mongoose.connect(process.env.MONGO_URI);

const Schema = mongoose.Schema;
//user schema
const UserSchema = new Schema({
  username: {type: String, required: true},
});
const UserModel = mongoose.model('UserModel', UserSchema);
//exercise schema
const ExerciseSchema = new Schema({
  username: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: Date, required: true},
  userId: {type: String, required: true},
})
const Exercise = mongoose.model('Exercise', ExerciseSchema);

app.use(cors());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//create and save new user
app.post('/api/users', bodyParser.urlencoded(), (req, res) => {
  //add username to database
  const newUser = new UserModel({
    username: req.body.username,
  });
  newUser.save()
  .then((data) => {
    return res.json({
      username: data.username,
      _id: data._id.toString(),
    });
  })
  .catch((err) => {
    return res.json({error: err});
  });
});

//return list of all users
app.get('/api/users', async (req, res) => {
  //get users
  const arrOfUsers = await UserModel.find()
  .then((data) => {
    return data;
  })
  .catch(err => {
    return res.json({ error: "no match found" });
  });
  return res.json(arrOfUsers);
});

//create and save new exercise linked to a user's id
app.post('/api/users/:_id/exercises', bodyParser.urlencoded(), async (req, res) => {
  //get _id
  const userId = req.params._id;

  //get username from database
  const username = await UserModel.findOne({ _id: userId})
  .then((data) => { return data.username })
  .catch((err) => { return res.json({ findOne_error: err })});
  
  //set values
  const description = req.body.description;
  const duration = Number(req.body.duration);
  let date;
  try {
    date = req.body.date ? moment(new Date(req.body.date)).format('YYYY-MM-DD[T00:00:00.000Z]') : moment(new Date()).format('YYYY-MM-DD[T00:00:00.000Z]');
  }
  catch {err => { return res.json({ date_error: err })}};
  
  //create new document
  const newExercise = new Exercise({
    username: username,
    description: description,
    duration: duration,
    date: date,
    userId: userId,
  })
  //add to database and return json object
  await newExercise.save()
  .then((data) => {
    return res.json({
      username: data.username,
      description: data.description,
      duration: data.duration,
      date: data.date.toDateString(),
      _id: data.userId,
    })
  })
  .catch((err) => { return console.log("can't add document: " + err) })
})

//return list of exercises linked to user
app.get('/api/users/:_id/logs', async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit = 0} = req.query;

  //convert limit to an integer
  const parsedLimit = parseInt(limit, 10);

  //check if parsedLimit is a positive integer
  if (isNaN(parsedLimit) || parsedLimit < 0) {
    return res.json({ error: 'Invalid limit value. Please provide a positive integer.' });
  }

  const arrOfExercises = await Exercise.find({
    userId: userId, 
    //conditional filter
    ...(from ? {
        date: {
          $gte: moment(new Date(from)).format('YYYY-MM-DD[T00:00:00.000Z]'),
        }
        } : {}
      ),
  ...(to ? {
        date : {
          $lt: moment(new Date(to)).format('YYYY-MM-DD[T00:00:00.000Z]')
        }
      } : {}
      )
  })
  .limit(limit)
  .then((data) => {
    return res.json({
      username: data[0].username,
      count: data.length,
      _id: data[0].userId,
      log: data.map((el) => {
            return {
              description: el.description,
              duration: el.duration,
              date: el.date.toDateString(),
            };
      })
    });
  })
  .catch((err) => { 
    return res.json({ error: "No exercise found, error: " + err }); 
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
