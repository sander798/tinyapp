const express = require("express");
const crypto = require("crypto");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const { 
  generateRandomString,
  findUserFromData,
  urlsForUser,
  doesUserOwnURL
} = require("./helpers");
const { urlDatabase, users } = require("./data");

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ["can'tguessme"],
  maxAge: 60 * 60 * 1000,
}));


app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  if (!req.session["user_id"]) { // If a user is not logged in, go to login page
    //res.status(400).send("You need to be logged in to view your URLs!");
    res.redirect("/login");
    return;
  }
  
  const templateVars = {
    urls: urlsForUser(req.session["user_id"], urlDatabase),
    user: users[req.session["user_id"]],
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.session["user_id"]) { // If a user is not logged in, send login reminder
    res.status(400).send("You need to be logged in to create new URLs!");
    return;
  }
  
  const tinyURL = generateRandomString();
  urlDatabase[tinyURL] = { // Add the POST request body to urlDatabase
    longURL: req.body.longURL,
    userID: req.session["user_id"],
  };
  res.redirect("/urls/" + tinyURL);
});

app.get("/urls/new", (req, res) => {
  if (!req.session["user_id"]) { // If a user is not logged in, redirect to /urls
    res.redirect("/urls");
    return;
  }
  
  const templateVars = { user: users[req.session["user_id"]], };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  if (!req.session["user_id"]) { // If a user is not logged in, redirect to /urls
    res.status(400).send("You need to be logged in to view this!");
    return;
  }
  
  if (!doesUserOwnURL(req.session["user_id"], req.params.id, urlDatabase)) {
    res.status(400).send("This isn't one of your URLs!");
    return;
  }
  
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.session["user_id"]],
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/edit", (req, res) => {
  if (!req.session["user_id"]) { // If a user is not logged in, give error message
    res.status(400).send("You need to be logged in to edit this!");
    return;
  }
  
  if (!Object.keys(urlDatabase).includes(req.params.id)) { // Check for existing URL
    res.status(400).send("No such URL to edit!");
    return;
  }
  
  if (!doesUserOwnURL(req.session["user_id"], req.params.id, urlDatabase)) {
    res.status(400).send("This isn't one of your URLs!");
    return;
  }
  
  // For some reason this check is needed to prevent blank overwrites when getting /urls/:id
  if (req.body.newLongURL) {
    urlDatabase[req.params.id].longURL = req.body.newLongURL;
  }
  
  //res.redirect("/urls/" + req.params.id); <- I think this is more user-friendly...
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  if (!req.session["user_id"]) { // If a user is not logged in, give error message
    res.status(400).send("You need to be logged in to delete this!");
    return;
  }
  
  if (!Object.keys(urlDatabase).includes(req.params.id)) { // Check for existing URL
    res.status(400).send("No such URL to delete!");
    return;
  }
  
  if (!doesUserOwnURL(req.session["user_id"], req.params.id, urlDatabase)) {
    res.status(400).send("This isn't one of your URLs!");
    return;
  }
  
  delete urlDatabase[req.params.id]; // Delete the url from the database
  res.redirect("/urls");
});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.status(400).send("No such URL in the database!");
    return;
  }
  
  res.redirect(urlDatabase[req.params.id].longURL);
});

app.get("/register", (req, res) => {
  if (req.session["user_id"]) { // If a user is already logged in, redirect to /urls
    res.redirect("/urls");
    return;
  }
  
  const templateVars = { user: users[req.session["user_id"]], };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  if (
    !req.body.newEmail
    || !req.body.newPassword
    || findUserFromData("email", req.body.newEmail, users) // Check for duplicate email
  ) {
    res.status(400).send("Unable to register user.");
    return;
  }
  
  const newID = generateRandomString();
  const hashedPassword = bcrypt.hashSync(req.body.newPassword, 10);
  users[newID] = {
    id: newID,
    email: req.body.newEmail,
    password: hashedPassword,
  };
  req.session.user_id = newID;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  if (req.session["user_id"]) { // If a user is already logged in, redirect to /urls
    res.redirect("/urls");
    return;
  }
  
  const templateVars = { user: users[req.session["user_id"]], };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const user = findUserFromData("email", req.body.email, users);
  
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    req.session.user_id = user.id;
    res.redirect("/urls");
  }
  
  res.status(403).send("Incorrect email or password.");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
