// Returns the user corresponding to the given data from the given list of users
const findUserFromData = function(key, data, userList) {
  if (!key || !data) {
    return undefined;
  }
  
  for (let i in userList) {
    if (userList[i][key] === data) {
      return userList[i];
    }
  }
  
  return undefined;
};

// Returns the urls made by the user
const urlsForUser = function(userID, urlDatabase) {
  if (!userID) {
    return null;
  }
  
  const userURLs = {};
  
  for (let i in urlDatabase) {
    if (urlDatabase[i].userID === userID) {
      userURLs[i] = {
        longURL: urlDatabase[i].longURL,
        userID: urlDatabase[i].userID,
      };
    }
  }
  
  return userURLs;
};

// Returns whether the user made the given short URL
const doesUserOwnURL = function(userID, shortURL, urlDatabase) {
  const userURLs = urlsForUser(userID, urlDatabase);
  
  for (let i in userURLs) {
    if (i === shortURL && userURLs[i].userID === userID) {
      return true;
    }
  }
  
  return false;
};

module.exports = {
  findUserFromData,
  urlsForUser,
  doesUserOwnURL,
};