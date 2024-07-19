const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

//connect to database
mongoose.connect(process.env.MONGO_URI);
const Schema = mongoose.Schema;
//user schema
const UserSchema = new Schema({
  username: {type: String, required: true, unique: true},
});
const UserModel = mongoose.model('UserModel', UserSchema);
//exercise schema
const ExerciseSchema = new Schema({
  username: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: String, required: true},
  _id_: {type: String, required: true},
})
const Exercise = mongoose.model('Exercise', ExerciseSchema);

app.use(cors());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', bodyParser.urlencoded(), (req, res) => {
  //get username from post form
  console.log(req.body.username);
  //add username to database
  const newUser = new UserModel({
    username: req.body.username,
  });
  newUser.save({isNew: true})
  .then()
  .catch((err) => {
    return res.json({error: err});
  });
});


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
    date = req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString();
  }
  catch {err => { return res.json({ date_error: err })}};
  
  //create new document
  const newExercise = new Exercise({
    username: username,
    description: description,
    duration: duration,
    date: date,
    _id_: userId,
  })
  //add to database
  await newExercise.save()
  .then((data) => {
    return res.json({
      username: data.username,
      description: data.description,
      duration: data.duration,
      date: data.date,
      _id: data._id_,
    })
  })
  .catch((err) => { return console.log("can't add document: " + err) })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
