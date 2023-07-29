const { assert } = require('chai');

const { findUserFromData } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('findUserFromData', function() {
  it('should return a user when given a valid email', function() {
    const user = findUserFromData("email", "user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    
    assert.deepEqual(testUsers[expectedUserID], user);
  });
  
  it('should return undefined when given an email not in the user list', function() {
    const user = findUserFromData("email", "bad@example.com", testUsers);
    const expectedUserID = "userRandomID";
    
    assert.deepEqual(undefined, user);
  });
});
