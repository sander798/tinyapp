const express = require("express");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  testUser: {
    id: "testUser",
    email: "testUser@test.com",
    password: "correctbatteryhorsestaple",
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
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]], };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const tinyURL = generateRandomString();
  urlDatabase[tinyURL] = req.body.longURL; // Add the POST request body to urlDatabase
  res.redirect("/urls/" + tinyURL);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/edit", (req, res) => {
  // For some reason this check is needed to stop blank overwrites when entering /urls/:id
  if (req.body.newLongURL) {
    urlDatabase[req.params.id] = req.body.newLongURL; // Update database with edited URL
  }
  
  res.redirect("/urls/" + req.params.id);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id]; // Delete the url from the database
  res.redirect("/urls");
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  
  if (!longURL) {
    res.status(400).send("No such URL in the database!");
  }
  
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  if (
    !req.body.newEmail
    || !req.body.newPassword
    || findUserFromData("email", req.body.newEmail) // Check for duplicate email
  ) {
    res.status(400).send("Unable to register user.");
    //res.redirect("/urls");
    return;
  }
  
  const newID = generateRandomString();
  users[newID] = {
    id: newID,
    email: req.body.newEmail,
    password: req.body.newPassword,
  };
  res.cookie("user_id", newID);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const user = findUserFromData("email", req.body.email);

  if (user && user.password === req.body.password) {
    res.cookie("user_id", user.id);
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
