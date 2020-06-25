const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/**
 * This class maintains the list of individual Story instances
 *  It also has some methods for fetching, adding, and removing stories
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /**
   * This method is designed to be called to generate a new StoryList.
   *  It:
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.*
   */

  // TODO: Note the presence of `static` keyword: this indicates that getStories
  // is **not** an instance method. Rather, it is a method that is called on the
  // class directly. Why doesn't it make sense for getStories to be an instance method?
  //  getStories is a static method because it is related to the class story list and not the instance of each story.

  static async getStories() {
    // query the /stories endpoint (no auth required)
    const response = await axios.get(`${BASE_URL}/stories`);

    // turn the plain old story objects from the API into instances of the Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    const storyList = new StoryList(stories);
    return storyList;
  }

  /**
   * Method to make a POST request to /stories and add the new story to the list
   * - user - the current instance of User who will post the story
   * - newStory - a new story object for the API with title, author, and url
   *
   * Returns the new story object
   */

  async addStory(user, newStory) {
    // TODO - Implement this functions!
    // this function should return the newly created story so it can be used in
    // the script.js file where it will be appended to the DOM
    const res = await axios({
      method: "POST",
      url: `${BASE_URL}/stories`, 
      data: {
      token: user.loginToken,
      story: newStory,
      }
  });
  newStory = new Story(res.data.story);
  this.stories.unshift(newStory);
  user.ownStories.unshift(newStory);
  return newStory;
  }

  // delete or remove stories
  async removeStory(user, storyId) {
    await axios({
      method: "DELETE",
      url: `${BASE_URL}/stories/${storyId}`,
      data: {
        token: user.loginToken
      }
    });
    // filter out story ID
    this.stories = this.stories.filter(story => story.storyId !== storyId);
    // filter out story form user's list
    user.ownStories = user.ownStories.filter(s => s.storyId !== storyId);
  }
} 



/**
 * The User class to primarily represent the current user.
 *  There are helper methods to signup (create), login, and getLoggedInUser
 */

class User {
  constructor(userObj) {
    this.username = userObj.username;
    this.name = userObj.name;
    this.createdAt = userObj.createdAt;
    this.updatedAt = userObj.updatedAt;

    // these are all set to defaults, not passed in by the constructor
    this.loginToken = "";
    this.favorites = [];
    this.ownStories = [];
  }

  /* Create and return a new user.
   *
   * Makes POST request to API and returns newly-created user.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async create(username, password, name) {
    const response = await axios.post(`${BASE_URL}/signup`, {
      user: {
        username,
        password,
        name
      }
    });

    // build a new User instance from the API response
    const newUser = new User(response.data.user);

    // attach the token to the newUser instance for convenience
    newUser.loginToken = response.data.token;

    return newUser;
  }

  /* Login in user and return user instance.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios.post(`${BASE_URL}/login`, {
      user: {
        username,
        password
      }
    });

    // build a new User instance from the API response
    const existingUser = new User(response.data.user);

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));

    // attach the token to the newUser instance for convenience
    existingUser.loginToken = response.data.token;

    return existingUser;
  }

  /** Get user instance for the logged-in-user.
   *
   * This function uses the token & username to make an API request to get details
   *   about the user. Then it creates an instance of user with that info.
   */

  static async getLoggedInUser(token, username) {
    // if we don't have user info, return null
    if (!token || !username) return null;

    // call the API
    const response = await axios.get(`${BASE_URL}/users/${username}`, {
      params: {
        token
      }
    });

    // instantiate the user from the API information
    const existingUser = new User(response.data.user);

    // attach the token to the newUser instance for convenience
    existingUser.loginToken = token;

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));
    return existingUser;
  }

  async retrieveDetails() {
    const response = await axios.get(`${BASE_URL}/users/${this.username}`, 
    {
      params: {
        token: this.loginToken
      }
    });

    // update user's properties from the API response.
    this.name = response.data.user.name;
    this.createdAt = response.data.user.createdAt;
    this.updatedAt = response.data.user.updatedAt;

    // convert favorites and ownStories to insstances of Story
    this.favorites = response.data.user.favorites.map(s => new Story(s));
    this.ownStories = response.data.user.stories.map(s => new Story(s));
    return this;
  }
  // method to post or delete to the API for stories
  async _toggleFavorite( storyId, httpVerb) {
    await axios({
      method: httpVerb,
      url: `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
      data: {
        token: this.loginToken
      }
    });
    await this.retrieveDetails();
    return this;
  }

  // function to add a story to the favorites list and update the API
  addFavorite(storyId){
  return this._toggleFavorite(storyId, "POST");
  }

  // function to remove a story to the favorites list and update the API
  removeFavorite(storyId){
    return this._toggleFavorite(storyId, "DELETE");
    }

  // // sends a patch request to update users name
  // async update(userData) {
  //   const response = await axios({
  //     method: "PATCH",
  //     url: `${BASE_URL}/users/${this.username}`,
  //     data: {
  //       user: userData,
  //       token: this.loginToken
  //     }
  //   });
  // //  update the user name with the response data
  //   this.name = response.data.user.name;

  //   return this;
  // }
  // // sends a DELETE request to the API to remove a user
  // async remove(){
  //   const response = await axios({
  //     method: "DELETE",
  //     url: `${BASE_URL}/users/${this.username}`,
  //     data: {
  //       token: this.loginToken
  //     }
  //   });
  // }
}


/**
 * Class to represent a single story.
 */

class Story {

  /**
   * The constructor is designed to take an object for better readability / flexibility
   * - storyObj: an object that has story properties in it
   */

  constructor(storyObj) {
    this.author = storyObj.author;
    this.title = storyObj.title;
    this.url = storyObj.url;
    this.username = storyObj.username;
    this.storyId = storyObj.storyId;
    this.createdAt = storyObj.createdAt;
    this.updatedAt = storyObj.updatedAt;
  }

//   // PATCH request to update a story
//   async update(user, storyData) {
//     const response = await axios({
//       method: "PATCH",
//       url: `${BASE_URL}/stories/${this.storyId}`,
//       data: {
//         token: user.loginToken,
//         story: storyData
//       }
//     });

//     const { author, title, url, updatedAt } = response.data.story;
//     // filds to update with a PATCH request
//     this.author = author;
//     this.title = title;
//     this.url = urlthis.updatedAt = updatedAt;

//     return this;
//   }
 }
