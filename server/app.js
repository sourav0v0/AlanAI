//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const cors = require('cors');

const app = express();
mongoose.connect('mongodb://localhost:27017/userDB',{useNewUrlParser: true,useUnifiedTopology: true});
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cors());

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  secret: String
});
const historySchema = new mongoose.Schema({
  googleId:String,
  source :String,
  count: Number,
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const History =new mongoose.model("History",historySchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "http://localhost:3001/" }),
  function(req, res) {
    console.log(req);
    res.redirect("http://localhost:3001/?page=getStarted&googleId="+req.user.googleId);
});

app.post("/postHistory", function(req, res){
  var b =false;
  console.log("--------------------");
  console.log(req.query);
  console.log("--------------------");
  History.find({googleId:req.query.googleId , source:req.query.source},function(err,res){
    if(err)  b=true;
    var i = 0;
    
    if(res == null || res.length === 0 || res === undefined)
    {
  
      var  histroy = new History({googleId:req.query.googleId,source:req.query.source,count:1});
      histroy.save(function(err,res){
        if(err) b=true;
      });
    }
    else{
    i=res[0].count+1;
    History.updateOne({googleId:req.query.googleId , source:req.query.source},{count : i},function(err,resp){
      if(err)
       b=true;
    });
    }
  });
  if(b)
    res.json({"Server Response":" Mongo Error "});
  res.json({"Server Response":"Success"});
});

app.get("/getHistory", function(req, res){
  var b =false;

  History.find({googleId:req.query.googleId}).lean().exec(function (err, users) {
    if(err) {
      console.log(err);
      b=true;
    }
    else
      res.json(JSON.stringify(users));
  });
  if(b)
    res.json({"Server Response":"Mongo Error"});
});

app.listen(3000, function() {
  console.log("Listentging on port 3000");
});
