/* ==================
// Data
================== */

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = process.env.PORT || 3000;
const connection = mongoose.connection;

const saltRounds = 12;

let signedin = false;
let currentuser = "(not signed in)";

app.use(bodyParser.urlencoded({ extended: true }));
app.use("/styles", express.static(__dirname + "/styles/"));
app.use("/scripts", express.static(__dirname + "/scripts/"));
app.set("view engine", "ejs");

// Mongoose things
mongoose.Promise = global.Promise;
let mongodbPassword = process.env.MONGODB_PASSWORD;
mongoose.connect(`mongodb+srv://thisofficenotes:${mongodbPassword}@cluster0.e1en0n4.mongodb.net/?retryWrites=true&w=majority`, { useUnifiedTopology: true, useNewUrlParser: true });

// System things
connection.on("error", console.error.bind(console, "Connection error: "));

// Schemas
const userSchema = new mongoose.Schema({
   username: String,
   userid: String,
   email: String,
   password: String,
   dateCreated: Date,
   notebooks: Array
});

// Set the schemas
const Users = mongoose.model("thisofficeUsers", userSchema);


/* ==================
// Dev
================== */

function getNewpageData() {
   Users.find({}).then((users) => {
      console.log("Users:", users);
      return {
         user: currentuser,
         users: users
      };
   }).catch((err) => { console.error(err); });
}


/* ==================
// Get requests
================== */

// Public user pages

app.get("/", (req, res) => { 
   if (!signedin) { res.render("partials/signedOut"); return; }
   res.render("home", { user: currentuser });
});
app.get("/notes", (req, res) => {
   if (!signedin) { res.render("partials/signedOut"); return; }
   res.render("notes", { user: currentuser });
});



/* ==================
// Login/logout
================== */

// Sign out
app.get("/sign-out", (req, res) => {
   signOut();
   res.redirect("/");
});

function signOut() {
   signedin = false;
   currentuser = "(not signed in)";
}

// Sign in
function signIn(user) {
   signedin = true;
   currentuser = user;
}


/* ==================
// Notes
================== */

app.get("/note-create", (req, res) => {
   if (!signedin) { res.render("partials/signedOut"); return; }
   let notebookid = decodeURIComponent(req.query.notebookid);
   Users.findById(currentuser._id).then(user => {
      let notebookIndex = user.notebooks.findIndex(notebook => notebook.id == notebookid);
      let newNote = {
         name: "New note",
         content: "",
         id: uuidv4(),
         dateCreated: new Date(),
         datesEdited: []
      };
      user.notebooks[notebookIndex].notes.push(newNote);
      user.markModified("notebooks");
      user.save();
      res.send({ state: "Success!", note: newNote });
   }).catch(err => {
      res.send({ state: "Error!", error: err });
      console.error(err);
   });
});


app.post("/note-delete", (req, res) => {
   if (!signedin) { res.render("partials/signedOut"); return; }
   Users.findById(currentuser._id).then(user => {
      let notebookIndex = user.notebooks.findIndex(notebook => notebook.id == req.body.notebookid);
      let noteIndex = user.notebooks[notebookIndex].notes.findIndex(note => note.id == req.body.id);
      user.notebooks[notebookIndex].notes.splice(noteIndex, 1);

      user.markModified("notebooks");
      user.save();
      res.send({ state: "Success!" });
   }).catch(err => {
      res.send(err);
      console.error(err);
   });
});

app.post("/note-edit", (req, res) => {
   if (!signedin) { res.render("partials/signedOut"); return; }
   let notebookid = req.body.notebookid;
   Users.findById(currentuser._id).then(user => {
      let notebookIndex = user.notebooks.findIndex(notebook => notebook.id == notebookid);
      let noteIndex = user.notebooks[notebookIndex].notes.findIndex(note => note.id == req.body.id);
      note = user.notebooks[notebookIndex].notes[noteIndex];

      if (req.body.type == "name") note.name = req.body.change;
      else note.content = req.body.change;

      note.datesEdited.push(new Date());

      user.notebooks[notebookIndex].notes[noteIndex] = note;

      user.markModified("notebooks");
      user.save();
      res.send({ state: "Success!" });
   }).catch(err => {
      res.send({ state: "Error!", error: err });
      console.error(err);
   });
});


/* ==================
// New notebook
================== */

app.get("/newnotebook", (req, res) => {
   if (!signedin) { res.render("partials/signedOut"); return; }
   createNotebook(decodeURIComponent(req.query.name), res);
});

app.get("/notebook-delete", (req, res) => {
   if (!signedin) { res.render("partials/signedOut"); return; }
   let notebookid = decodeURIComponent(req.query.notebookid);
   Users.findOneAndUpdate(
      { userid: currentuser.userid },
      { $pull: { notebooks: { id: notebookid } } },
   ).then((user) => {
      res.send({ state: "Success!" });
   }).catch((err) => { console.error(err); });
});


function createNotebook(title, res) {
   let id = uuidv4();
   Users.findOneAndUpdate(
      { userid: currentuser.userid },
      { $push: { notebooks: {
         title: title,
         id: id,
         dateCreated: new Date(),
         notes: []
      } } },
   ).then((user) => {
      let notebook = user.notebooks.find(notebook => notebook.id == id);
      res.send(notebook);
   }).catch((err) => { console.error(err); });
}


/* ==================
// Get data
================== */

app.get("/getnotebooks", (req, res) => {
   Users.findOne(
      { userid: currentuser.userid }
   ).then((user) => {
      res.send(user.notebooks);
   }).catch((err) => { console.error(err); });
});

app.get("/getnotes", (req, res) => {
   Users.findOne(
      { userid: currentuser.userid }
   ).then((user) => {
      let notebook = user.notebooks.find(notebook => notebook.id == req.query.notebookid);
      res.send(notebook.notes);
   }).catch((err) => { console.error(err); });
});


/* ==================
// Account
================== */

// Sign in
app.post("/user/login", (req, res) => {
   Users.findOne({ email: req.body.email }).then((user) => {
      if (!user) { res.send("There is no account with this email"); }
      else if (user) {
         bcrypt.compare(req.body.pscd, user.password)
            .catch(err => console.error(err.message))
            .then(match => {
               if (match) { signIn(user); res.send("Success!"); }
               else res.send("Wrong password");
         });
      }
   }).catch((err) => { console.error(err); });;
});

// Sign up
app.post("/user/create", (req, res) => {
   asyncCreate();
   async function asyncCreate() {
      Users.findOne({ email: req.body.emil }).then((err, user) => {
         if (err) return console.error(err);
         else {
            if (user) {
               res.send("This email is already used!");
               return;
            }
            else {
               lazyBycrypt(req.body.pscd).then((passhash) => {
                  const newUser = new Users({
                     username: req.body.name,
                     email: req.body.emil,
                     password: passhash,
                     dateCreated: Date.now(),
                     userid: uuidv4()
                  });
                  newUser.save().catch(err => console.error(err));
                  sendEmail(
                     "💼 Your This Office account has been created",
                     `<h2>Yes!</h2>
                     <h4>💼 Your This Office account has been created</h4>
                     <p>Your This Office account (${req.body.name}) has been created. Your data is not encrypted and can be viewed by me or anyone else who has access to the database password, which I leak occasionally. Enjoy your account!</p>
                     <i>Editor Rust :)</i>
                     <p>vegetabledash@gmail.com</p>`,
                     req.body.emil
                  );
                  // Sign in and go home
                  signIn(newUser);
                  res.send("Success!");
                  res.redirect(`/newnotebook?name=${encodeURIComponent("Starter notebook")}`)
               })
            }
         }
      })
   }
});

let lazyBycrypt = (pass) => {
   return new Promise((resolve) => {
      bcrypt.hash(pass, saltRounds)
      .catch(err => console.error(err.message))
      .then(hash => { resolve(hash); });
   });
}

/* ==================
// Mail
================== */

// You've got mail. Wait a second, ok now you do.
const transporter = nodemailer.createTransport({
   service: "gmail",
   auth: {
      user: "vegetabledash@gmail.com",
      pass: process.env.EMAIL_PASSWORD
  }
});

function sendEmail(title, text, recipient) {
   var mailOptions = {
      from: "vegetabledash@gmail.com",
      to: recipient,
      subject: title,
      html: text
   };
   
   transporter.sendMail(mailOptions, function(err, info){
      if (err) console.error(info, err);
   });
}

/* ==================
// Important stuff
================== */

// Get all lost requests
app.get("*", (req, res) => {
   res.render("lost");
});

app.listen(port);




// Auto sign in me
Users.findOne({ email: "hnasheralneam@gmail.com" }).then((user) => { signIn(user); });
