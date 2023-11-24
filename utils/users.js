const users = [];

// Join user to chat
function userJoin(id, username, channel) {
  const user = { id, username, channel };

  users.push(user);

  return user;
}

// Get current user
function getCurrentUser(id) {
  return users.find(user => user.id === id);
}

// User leaves chat
function userLeave(id) {
  const index = users.findIndex(user => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

// Get channel users
function getChannelUsers(channel) {
  return users.filter(user => user.channel === channel);
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getChannelUsers
};
