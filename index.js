const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

//connect to database
mongoose.connect(process.env.MONGO_URI);
const Schema = mongoose.Schema;
const UserSchema = new Schema({
  username: {type: String, required: true, unique: true},
});
const UserModel = mongoose.model('UserModel', UserSchema);

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
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
