"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    // UNIMPLEMENTED: complete this function! NOW IMPLEMENTED!
    return new URL(this.url).host;
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method? Because we want to be able to access the static method anywhere from within the code without having to create an instance of the class.

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    console.log(response.data);
    
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, { title, author, url }) {
    console.log("add story", user, { title, author, url } )
    // UNIMPLEMENTED: complete this function!  Now Implemented!
    
    const token = user.loginToken;
    const response = await axios({
      method: "POST",
      url: `${BASE_URL}/stories`, 
      data: { token, story: { title, author, url } },
    });
    
    const story = new Story(response.data.story);
    this.stories.unshift(story);
    user.ownStories.unshift(story);

    return story;
  }


/**Delete story from API and remove from story list from DOM
 * - token required from user: the current User instance
 * - storyId: id of story to be removed by user
 */

async removeStory(user, storyId) {
  const token = user.loginToken;
  await axios({
    url: `${BASE_URL}/stories/${storyId}`,
    method: "DELETE",
    data: { token: user.loginToken }
  });

  //filter out story by removing storyId
  this.stories = this.stories.filter(story => story.storyId != storyId);

  //filter out story by removing storyId for user's list of stories and user's favorites
  user.ownStories = user.ownStories.filter(s => s.storyId !== storyId);
  user.favorites = user.favorites.filter(s => s.storyId !== storyId);
  }
}

/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = []
              },
              token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Sign up new user in API and receive token from server, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  
  /** Log user in with API and receive a token, make User instance & return it 
   * - username: existing user's username
   * - password: existing user's password 
  */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }  


  /** When we already have credentials (token & username) for a user,
   *   we can log them in and update the user automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

  /** Add a story as a favorite to the user's favorites list OR remove a story from user's favorites list and update API
   * - story: a Story instance to add to favorites
   */

  async addFavorite(user, storyId, story) {

    const token = this.loginToken;
  
    let result = await axios({
      url: `${BASE_URL}/users/${user.username}/favorites/${storyId}`,
      method: "POST",
      data: { token }
    });



    this.favorites.push(story);

    console.log("result", result)


  }

  /** Remove a story from user's favorites list and update API
   * - story: the Story instance to remove from favorites
   */

  async removeFavorite(user, storyId, story) {
    const token = this.loginToken;



    this.favorites = this.favorites.filter(s => {
      
     if(s.storyId  /*this represea all favorites*/ !== storyId /*target*/){ //include everything but that one
        return true
     } else {
        return false
     }
    
    });

    

    await axios({
      url: `${BASE_URL}/users/${user.username}/favorites/${storyId}`,
      method: "DELETE",
      data: { token }
    });

    showFavoritesListOnPage();
  }

isFavorite(story) {
  return this.favorites.some(s => (s.storyId === story.storyId));
}
}