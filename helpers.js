// Returns the user corresponding to the given data from the given list of users
const findUserFromData = function(key, data, userList) {
  if (!key || !data) {
    return undefined;
  }
  
  for (let userKey in userList) {
    if (userList[userKey][key] === data) {
      return userList[userKey];
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
  
  for (let entry in urlDatabase) {
    if (urlDatabase[entry].userID === userID) {
      userURLs[entry] = {
        longURL: urlDatabase[entry].longURL,
        userID: urlDatabase[entry].userID,
      };
    }
  }
  
  return userURLs;
};

// Returns whether the user made the given short URL
const doesUserOwnURL = function(userID, shortURL, urlDatabase) {
  const userURLs = urlsForUser(userID, urlDatabase);
  
  for (let urlKey in userURLs) {
    if (urlKey === shortURL && userURLs[urlKey].userID === userID) {
      return true;
    }
  }
  
  return false;
};

module.exports = {
  generateRandomString,
  findUserFromData,
  urlsForUser,
  doesUserOwnURL,
};