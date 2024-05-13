"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() { //controller
  storyList = await StoryList.getStories(); //model
  console.log("storyList", storyList)
  $storiesLoadingMsg.remove();

  putStoriesOnPage(); //view
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 * - showDeleteBtn: show delete button
 *
 * Returns the markup for the story.
 */



function makeStoryMarkup(story, showDeleteBtn = false) { //view makes the html
  console.debug("makeStoryMarkup", story);

  const hostName = story.getHostName();

  const displayStar = Boolean(currentUser);

  return $(`
      <li id="${story.storyId}">
        <div>
        ${showDeleteBtn ? makeDeleteBtnHTML() : ""}
        ${displayStar ? makeStarHTML(story, currentUser) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
        </div>
      </li>
    `);
}

/** Make delete button HTML for story */

function makeDeleteBtnHTML() {
  return `
    <span class="trash-can">
      <i class="fas fa-trash-alt"></i>
    </span>`;
}

/** Make favorite/non-favorite star for story  */

function makeStarHTML(story, user) {
  const isFavorite = user.isFavorite(story);
  const starSelected = isFavorite ? "fas" : "far";
  return `
    <span class="star">
      <i class="${starSelected} fa-star"></i>
    </span>`;  
}

/** Gets list of stories from server, make their HTML, and display on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  console.log(storyList.stories)

  $allStoriesList.empty();

  //loop through all of my stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = makeStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

/** Handle deleting a story */

async function deleteStoryHTML(evt) {
  console.debug("deleteStoryHTML");

  const $closestLi = $(evt.target).closest("li");
  const storyId = $closestLi.attr("id");

  await storyList.removeStory(currentUser, storyId);

  //re-generate story list
  await showUserStoriesOnPage();
}

$ownStories.on("click", ".trash-can", deleteStoryHTML);


/** Handle when user submits new story form  */

async function submitNewStory(evt) {
  //grabing data from the form
  console.debug("submitNewStory");
  evt.preventDefault();

  //grab all required info from form
  const author = $("#make-author").val();
  const title = $("#make-title").val();
  const url = $("#make-url").val();
  const username = currentUser.username;
  const storyData = { author, title, url, username };

  const story = await storyList.addStory(currentUser, storyData); //model

  // const $story = makeStoryMarkup(story);//view

  //hide form and reset it

  $submitForm.slideUp("slow");
  $submitForm.trigger("reset");
}

$submitForm.on("submit", submitNewStory);

/** Functionality for list of user's own stories */

function showUserStoriesOnPage() { //view
  console.debug("showUserStoriesOnPage");

  $ownStories.empty();

  if (currentUser.ownStories.length === 0) {
    $ownStories.append("<h5>No stories added by user yet, please add!</h5>");
  } else {
    //loop through all of users own stories and make HTML for them
    for (let story of currentUser.ownStories) {
      let $story = makeStoryMarkup(story, true);
      $ownStories.append($story);
    }
  }

  $ownStories.show();
}

/** Functionality for favorites list and star/un-star a story */
/** Show favorites list on page */

function showFavoritesListOnPage() { //view
  console.debug("showFavoritesListOnPage");

  console.log(currentUser.favorites);
  $favoritedStories.empty();

  if (currentUser.favorites.length === 0) {
    $favoritedStories.append("<h5>No favorites added yet, please add!</h5>");
  } else {
    //loop through all of users favorites and make HTML for them
    for (let story of currentUser.favorites) {
      const $story = makeStoryMarkup(story);
      $favoritedStories.append($story);
    }
  }

  $favoritedStories.show();
}

/** Handle toggling favorite/unfavorite a story */

async function toggleFavOrNotStory(evt) { //controller commucates with html
  console.debug("toggleFavOrNotStory");

  const $target = $(evt.target);
  const $closestLi = $target.closest("li");
  const storyId = $closestLi.attr("id");
  const story = storyList.stories.find(s => s.storyId === storyId);

  //check if item is already favorited by star selection

  if ($target.hasClass("fas")) {
    //is a favorite, remove from user's favorite list and change star 
    await currentUser.removeFavorite(currentUser,storyId, story); //model
    $target.closest("i").toggleClass("fas far");
  } else {
    //not a favorite, add to user's favorite list and change star
   
    await currentUser.addFavorite(currentUser,storyId,story); //model
    $target.closest("i").toggleClass("fas far");
  }
}

$storiesList.on("click", ".star", toggleFavOrNotStory);
