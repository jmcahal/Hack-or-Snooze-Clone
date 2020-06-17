$(async function() {
  // cache some selectors we'll be using quite a bit
  
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $myStories = $("#nav-my-stories");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $navSubmit = $("#nav-submit");
  const $mainNavLinks = $("#main-nav-links");
  const $container = $(".articles-container");
  const $favorites = $("#favorited-articles");
  const $navFaves = $("#nav-favorites");
  // const $body = $("body");
  // const $navWelcome = $("#nav-welcome");
  const $naveUserProfile =$("#nav-user-profile");
  // const $userProfile =$("#user-profile");

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

// Event listener for the article form submission. 
$submitForm.on("submit", async function(evt) {
  evt.preventDefault(); // no page-refresh on submit

  // grab the author, title, and url.
  const author = $("#author").val();
  const title = $("#title").val();
  const url = $("#url").val();
  const hostName = getHostName(url);
  const username = currentUser.username;
  const storyObject = await storyList.addStory(currentUser, {
    title,
    author,
    url,
    username
  });
  const $li = $(`
      <li id="${storyObject.storyId}" class="id-${storyObject.storyId}">
        <span class="star">
          <i class="far fa-star"></i>
        </span>
        <a class="article-link" href="${url}" target="a_blank">
          <strong>${title}</strong>
        </a>
        <small class="article-author">by ${author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${username}</small>
      </li>
    `);
  $allStoriesList.prepend($li);
  $submitForm.slideUp("slow");
  $submitForm.trigger("reset");
});

// Event handler for star/ favorite clicks
$container.on("click",".star", async function(evt){
console.log("click");
  if(currentUser){
    const $target = $(evt.target);
    const $closestLi = $target.closest("li");
    const storyId = $closestLi.attr("id");
    if($target.hasClass("fas")){
      console.log("fas");
      await currentUser.removeFavorite(storyId);
      $target.closest("i").toggleClass("fas far");
    }
    else {
      console.log("far");
      await currentUser.addFavorite(storyId);
      $target.closest("i").toggleClass("fas far");
    }
  }  
});

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

// Event handler to get article submission form.
$navSubmit.on("click", function() {
  // show the $submitForm to store new article
  $submitForm.show();
});


// Event handler to get article favorites page.
$navFaves.on("click", function() {
  console.log("showing faves");
  // hide elements
  hideElements();
  if(currentUser){
    generateFaves();
    // show favorites
    $favorites.show();
  }
});
  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function() {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

$myStories.on("click", function(){
  hideElements();
  if(currentUser){
    generateMyStories();
    $ownStories.show();
  }
})

// Event handler for deleting a story
$ownStories.on("click", ".trash-can", async function(evt) {
  // story id
  const $closestLi = $(evt.target).closest("li");
  const storyId = $closestLi.attr("id");
  // remove from API
  await storyList.removeStory(currentUser, storyId);
  //  get story list
  await generateStories();
  // hide other elements
  hideElements();
  // show story list
  $allStoriesList.show();
});

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
      generateProfile();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();

    // generate profile
    generateProfile();

  }


  //  Generate a user profile based on global "user"
  function generateProfile() {
    $("#profile-name").text(`Name: ${currentUser.name}`);
    $("#profile-username").text(`Username: ${currentUser.username}`);
    $("#profile-account-date").text(`Account Created: ${currentUser.createdAt.slice(0,10)}`);
    $naveUserProfile.text(`${currentUser.username}`);
  }
  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   * add trashcan if story is owned by the currentUser
   */

  function generateStoryHTML(story, isOwnStory) {
    let hostName = getHostName(story.url);
    let starType = isFavorite(story) ? "fas" : "far";
    // create trashcan if story is owned by the current User
    const trashCanIcon = isOwnStory ?
    `<span class="trash-can">
      <i class="fas fa-trash-alt"></i>
      </span>` : "";
    // render story markup
    // added star span
    const storyMarkup = $(`
      <li id="${story.storyId}">
        ${trashCanIcon}
        <span class="star">
          <i class ="${starType} fa-star"></i>
        </span>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  //  Function to build the favorites list
  function generateFaves(){
    $favorites.empty();

    // if the current user has no favorites add "No favorites added!"
    if (currentUser.favorites.length ===0){
      $favorites.append("<h5>No favorites added!</h5>");
    }
    else {
      // loop over each story in the list and render it
      for(let story of currentUser.favorites) {
        let favoriteHTML = generateStoryHTML(story, false, true);
        $favorites.append(favoriteHTML);
      }
    }
  }

// generate my stories for the my stories page
function generateMyStories() {
  $ownStories.empty();
  // if user currently has not posted any stories
  if(currentUser.ownStories.length ===0) {
    $ownStories.append("<h5>No stories added by user yet...</5>");
  }
  else {
    // do this for all of the user's posted stories
    for (let story of currentUser.ownStories){
    let ownStoryHTML = generateStoryHTML(story, true);
    $ownStories.append(ownStoryHTML);
    }   
  }
  $ownStories.show();
}
  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $favorites,
      $loginForm,
      $createAccountForm
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    $mainNavLinks.show();
  }

  //  see if a story is a favorite
  function isFavorite(story){
    let favStoryIds = new Set();
    if (currentUser) {
      favStoryIds = new Set(currentUser.favorites.map(obj => obj.storyId));
    }
    return favStoryIds.has(story.storyId);
  }


  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }

});

