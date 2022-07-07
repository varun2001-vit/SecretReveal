//jshint esversion:6
require('dotenv').config();
const express= require('express');
const mongoose= require('mongoose');
const bodyParser= require('body-parser');
const session = require('express-session');
const passport= require('passport');
const passportLocalMongoose= require('passport-local-mongoose');
const ejs = require('ejs');
//packages--end
const app = express();
var encrypt = require('mongoose-encryption');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
//session
app.use(session({
    secret: 'MereDolnaSun',
    resave: false,
    saveUninitialized: true,
  }))
app.use(passport.initialize());
app.use(passport.session());
//connect to server
mongoose.connect('mongodb://localhost:27017/secretsDB');
const secretschema=mongoose.Schema({
    email:String,
    password:String,
    secrets:String
}) 
//encryption

secretschema.plugin(passportLocalMongoose);//hashing salting
const Secret=mongoose.model('Secret',secretschema);
passport.use(Secret.createStrategy());
passport.serializeUser(Secret.serializeUser());
passport.deserializeUser(Secret.deserializeUser());

app.get("/",function(req,res){
    res.render("home");
});
app.get("/register",function(req,res){
    res.render("register");
});
app.get("/login",function(req,res){
    res.render("login");
});
app.get("/secrets",function(req,res){
    if(req.isAuthenticated())
    {
        Secret.find({secrets:{$ne:null}},function(err,secretusers){
            if(err)
            {
                console.log("Error: " + err);
            }
            else
            {
                if(secretusers)
                {
                   res.render("secrets",{userswithsecrets:secretusers});
                }
            }
        })
    }else
    {
        res.redirect("/login");
    }
});
app.get("/submit",function(req,res){
    if(req.isAuthenticated())
    {
        res.render("submit");
    }else
    {
        res.redirect("/login");
    }
});
app.post("/submit",function(req,res){
    const secrets = req.body.secret;
    const userid=req.user._id;
    Secret.findOne({_id:userid},function(err,founduser){
        if(err)
        {
            console.log("error");
        }
        else
        {
            if(founduser)
            {
                founduser.secrets=secrets;
                founduser.save(function(err,user){
                    res.redirect("/secrets");
                    
                });
            }
        }

    })
})
app.listen(3000, function() {
    console.log("Server started on port 3000");
  });
//register
app.post("/register",function(req,res){
    const user = req.body.username;
    const password = req.body.password;
    Secret.register({username: user},password,function(err,user){
        if(err){
            console.log("Error: " + err);
            res.redirect("/register");
        }
        else {
                passport.authenticate("local")(req,res,function(){
                    res.redirect("/secrets");
                });
        }
    });
    
})
app.get("/logout", function(req, res){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});

//login
app.post("/login",function(req,res){
    const id = req.body.username;
    const password = req.body.password;
    const newloginuser=new Secret({
        username:id,
        password:password
    });
    req.login(newloginuser, function(err){
        if(err){
            console.log(err);
        }
        else {
               passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");
               });

            }
    });

   
});
  