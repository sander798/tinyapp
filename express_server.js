const express = require("express");
const crypto = require("crypto");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ["can'tguessme"],
  maxAge: 60 * 60 * 1000,
}));

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "testUser"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "testUser"
  },
};

const users = {
  testUser: {
    id: "testUser",
    email: "testUser@test.com",
    password: "$2a$10$Q3T742NMxmons95v9Zv.W.LbXxRattl65lWYjPdZGi9VoT0PuAKGK",
    //correctbatteryhorsestaple
  },
};

function generateRandomString() {
  return crypto.randomBytes(3).toString("hex");
}

// Return the user corresponding to the given data
function findUserFromData(key, data) {
  if (!key || !data) {
    return null;
  }
  
  for (let i in users) {
    if (users[i][key] === data){
      return users[i];
    }
  }
  
  return null;
}

function urlsForUser(id) {
  if (!id) {
    return null;
  }
  
  const userURLs = {};
  
  for (let i in urlDatabase) {
    if (urlDatabase[i].userID === id) {
      userURLs[i] = {
        longURL: urlDatabase[i].longURL,
        userID: urlDatabase[i].userID,
      };
    }
  }
  
  return userURLs;
}

function doesUserOwnURL(userID, shortURL) {
  const userURLs = urlsForUser(userID);
  
  for (let i in userURLs) {
    if (i === shortURL && userURLs[i].userID == userID) {
      return true;
    }
  }
  
  return false;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  if (!req.session["user_id"]) { // If a user is not logged in, send login reminder
    res.status(400).send("You need to be logged in to view your URLs!");
    return;
  }
  
  const templateVars = { 
    urls: urlsForUser(req.session["user_id"]),
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
  } else if (!doesUserOwnURL(req.session["user_id"], req.params.id)) {
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
  } else if (!Object.keys(urlDatabase).includes(req.params.id)) { // Check for existing URL
    res.status(400).send("No such URL to edit!");
    return;
  } else if (!doesUserOwnURL(req.session["user_id"], req.params.id)) {
    res.status(400).send("This isn't one of your URLs!");
    return;
  }
  
  // For some reason this check is needed to stop blank overwrites when entering /urls/:id
  if (req.body.newLongURL) {
    urlDatabase[req.params.id].longURL = req.body.newLongURL; // Update database with edited URL
  }
  
  res.redirect("/urls/" + req.params.id);
});

app.post("/urls/:id/delete", (req, res) => {
  if (!req.session["user_id"]) { // If a user is not logged in, give error message
    res.status(400).send("You need to be logged in to delete this!");
    return;
  } else if (!Object.keys(urlDatabase).includes(req.params.id)) { // Check for existing URL
    res.status(400).send("No such URL to delete!");
    return;
  } else if (!doesUserOwnURL(req.session["user_id"], req.params.id)) {
    res.status(400).send("This isn't one of your URLs!");
    return;
  }
  
  delete urlDatabase[req.params.id]; // Delete the url from the database
  res.redirect("/urls");
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  
  if (!longURL) {
    res.status(400).send("No such URL in the database!");
  }
  
  res.redirect(longURL);
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
    || findUserFromData("email", req.body.newEmail) // Check for duplicate email
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
  const user = findUserFromData("email", req.body.email);

  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    req.session.user_id = user.id;
    res.redirect("/urls");
  }
  
  res.status(403).send("Incorrect email or password.");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
