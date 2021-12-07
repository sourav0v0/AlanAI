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

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});
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
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
  console.log('heroeroer');
  
  // History.findOne({ 'googleId': req.googleId }, function (err, history) {
  //   if (err) return res.json({request:'fail'});
  //   console.log(history);
  // });
  res.json({"bad request":"Failed in the hub Request"});
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "http://localhost:3001/" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("http://localhost:3001/");
  });



app.post("/postHistory", function(req, res){
  const googleId = req.body.googleId;
  const source = req.body.source;
  History.findOneAndUpdate({googleId : googleId,source:source}, 
    { $set: { count: count+1 }},function(err,resp){
      if(!err)console.log(" Filae s");
      console.log(reps);
    });
  return res.json({success:'stgatus'});
});

app.get("/logout", function(req, res){
  console.log('heroeroer');
  return res.json({request:'pass'});
});
app.get("/hero", function(req, res){
  console.log('heroeroer');
  return res.json({request:'pass'});
});
app.get("/history", function(req, res){

});
app.listen(3999, function() {
  console.log("Server started on port 3999.");
});
