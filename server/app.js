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

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true,useUnifiedTopology: true});
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
  // var  histroy = new History({googleId:'1212121212',source:'CNN',count:10});
  // histroy.save(function(err,res){
  //   if(err) console.log(" inder aaya Eroor ");
  //   console.log(res);
  // });
  var b =false;
  History.find({googleId:req.query.googleId , source:req.query.source},function(err,res){
    if(err)  b=true;;
    var i = res[0].count;
    i+=1;
    History.updateOne({googleId:req.query.googleId , source:req.query.source},{count : i},function(err){
      if(err)
       b=true;
    });
  });
  if(b)
    res.json({"Server Response":" Mongo Error "});
    res.json({"Server Response":"Success"});
});

app.post("/", function(req, res){
  var b =false;
  History.find({googleId:req.query.googleId , source:req.query.source},function(err,res){
    if(err) console.log(" inder aaya Eroor ");
    else
    console.log(res);
  });
  if(b)
    res.json({"Server Response":"Mongo Error"});
  res.json({"Server Response":"Success"});
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
  History.findOne({googleId : googleId,source:source},function(err,history){
    if(history === null || err){
      History.updateOne({googleId : googleId,source:source}, 
        { $set: { count: 1 }},function(err,resp){
          if(err)console.log(" Filae s");
          else
          console.log(resp);
        });
    }
    else{
      console.log(" inder aaya ");
      var histroy = new History({googleId:'1212121212',source:'CNN',count:10});
      history.save(function(err,res){
        if(err) console.log(" inder aaya Eroor ");
        console.log(res);
      });
    }
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
