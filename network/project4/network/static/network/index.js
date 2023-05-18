

document.addEventListener('DOMContentLoaded', function () {

  // Declare Username of profile being viewed variable at a higher scope
let currentUsername = '';

  // Add event listener for the newpost form submission
  document.querySelector('#newpost-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const content = document.querySelector('#newpost-textarea').value.trim();

    // Token for security
    const csrfToken = document.getElementsByName("csrfmiddlewaretoken")[0].value;

    fetch('/api/save_post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      body: JSON.stringify({
        content: content
      })
    })
      .then(response => {
        if (response.ok) {
          location.reload();
        } else {
          console.error('Error saving post:', response.statusText);
        }
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  });

  // Add event listener for the follow unfollow button
  document.querySelector("#follow-button").addEventListener("click", () => {
    // Get the username of the user whose profile page is currently being viewed (taken from code later on)
    const username = currentUsername;

    // Send a POST request to the server to update the current user's following list
    fetch(`/api/follow/${username}`, {
      method: "POST",
    })
      .then(response => response.json())
      .then(data => {
        // Check if the response contains an error
        if (data.error) {
          // Display the error message to the user
          console.error('Error:', data.error);
          // You can show the error message on the page using an alert 
          document.getElementById('error-message').textContent = data.error;
          return; // Stop further execution of the code
        }

        // Update the 'Follow' or 'Unfollow' button based on the server's response
        if (data.followed) {
          document.querySelector("#follow-button").textContent = "Unfollow";
        } else {
          document.querySelector("#follow-button").textContent = "Follow";
        }

        // Check if the user's profile elements already exist
        const userNameElement = document.querySelector("#userposts-view h2");
        const followElement = document.querySelector("#userposts-view p#followers-count");

        // If the elements don't exist, create and prepend them to the #userposts-view container
        if (!userNameElement) {
          const userNameElement = document.createElement("h2");
          userNameElement.textContent = `${data.posts[0].post_owner__first_name} ${data.posts[0].post_owner__last_name}'s Profile`;
          document.querySelector("#userposts-view").prepend(userNameElement);
        }

        if (!followElement) {
          const followElement = document.createElement("p");
          followElement.id = "followers-count";
          document.querySelector("#userposts-view").prepend(followElement);
        }

        // Update the follower and following counts
        document.querySelector("#followers-count").textContent = `Followers: ${data.followers_count}, Following: ${data.following_count}`;

        // Refetch the user's profile data to ensure follower count and follow button state are accurate
        loadPosts('userposts', 1, username);
      });
  });

  // Add event listener for the "Following" link
  document.querySelector('#followed-link').addEventListener('click', function () {
    // Call loadPosts with 'followed' as the view
    loadPosts('followed', 1);
  });

  function addEventListeners(postElement, post, csrfToken) {
    // Add the event listener for the user-link click
    const userLink = postElement.querySelector('.user-link');
    userLink.addEventListener('click', (event) => {
      event.preventDefault();
      const username = event.target.getAttribute("data-username");
      loadPosts('userposts', 1, username);
    });

    // Add the event listener to the like button
    const likeButton = postElement.querySelector('.like-button');
    likeButton.addEventListener('click', () => {
      fetch(`/api/likes/${post.id}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        }
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            if (data.message === 'Operation save like completed successfully') {
              likeButton.classList.add('liked-button');
            } else if (data.message === 'Operation delete like completed successfully') {
              likeButton.classList.remove('liked-button');
            }

            const likeCountSpan = postElement.querySelector('.like-count');
            const currentLikeCount = parseInt(likeCountSpan.textContent, 10);
            likeCountSpan.textContent = currentLikeCount + (data.message === 'Operation save like completed successfully' ? 1 : -1);
          } else {
            console.error('Error:', data.message);
          }
        })
        .catch(error => {
          console.error('Error fetching data:', error);
        });
    });

    // Add the event listener to the Edit button
    const editButton = postElement.querySelector('.edit-button');
    if (editButton) {
      editButton.addEventListener('click', () => {
        // Check with the backend if the user owns the post
        fetch(`/api/check_post_ownership/${post.id}/`)
          .then(response => response.json())
          .then(data => {
            if (data.success && data.is_owner) {
              // Owner of the post, allow editing
              if (editButton.textContent === 'Edit') {
                const contentElement = postElement.querySelector('.post-content');
                const textareaElement = document.createElement('textarea');
                textareaElement.value = contentElement.textContent.trim();
                contentElement.replaceWith(textareaElement);
                editButton.textContent = 'Save';
              } else if (editButton.textContent === 'Save') {
                const textareaElement = postElement.querySelector('textarea');
                const updatedContent = textareaElement.value.trim();

                if (updatedContent) {
                  // Token for security
                  const csrfToken = document.getElementsByName("csrfmiddlewaretoken")[0].value;

                  fetch(`/api/update_post/${post.id}/`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify({
                      content: updatedContent
                    })
                  })
                    .then(response => response.json())
                    .then(data => {
                      console.log(data); // Log the response for debugging purposes
                      if (data.success) {
                        const newContentElement = document.createElement('p');
                        newContentElement.classList.add('post-content');
                        newContentElement.textContent = updatedContent;
                        textareaElement.parentNode.replaceChild(newContentElement, textareaElement);
                        editButton.textContent = 'Edit';
                      } else {
                        console.error('Error:');
                      }
                    })
                    .catch(error => {
                      console.error('Error fetching data:');
                    });
                }
              }
            } else {
              console.error('Error: you are not authorised to edit this post', data.error);
              alert('Error: you are not authorised to edit this post' + data.error);
            }
          })
          .catch(error => {
            console.error('Error fetching data:', error);
          });
      });
    }
  }

  function loadPosts(view, page_number, username = "") {
    let url = `/api/posts/${view}/${page_number}/`;
    if (username) {
      url += `${username}/`;
    }
    const csrfToken = document.getElementsByName("csrfmiddlewaretoken")[0].value;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data.posts.length > 0) {
          currentUsername = data.posts[0].post_owner__username;
        }

        // Hide all views
        document.querySelector("#allposts-view").style.display = 'none';
        document.querySelector("#userposts-view").style.display = 'none';
        document.querySelector("#followingposts-view").style.display = 'none';

        // Show the appropriate view
        let postsContainer;
        if (view === 'allposts') {
          document.querySelector("#allposts-view").style.display = 'block';
          postsContainer = document.querySelector("#posts-container");
        } else if (view === 'userposts') {
          document.querySelector("#userposts-view").style.display = 'block';
          postsContainer = document.querySelector("#userposts-container");

          // Check if the user's profile elements already exist
          const userNameElement = document.querySelector("#userposts-view h2");
          const followElement = document.querySelector("#userposts-view p#followers-count");

          // If the elements exist, remove them
          if (userNameElement) {
            userNameElement.remove();
          }

          if (followElement) {
            followElement.remove();
          }

          // Display the user's first name, last name, and followers/following counts
          const newUserNameElement = document.createElement("h2");
          newUserNameElement.textContent = `${data.posts[0].post_owner__first_name} ${data.posts[0].post_owner__last_name}'s Profile`;
          document.querySelector("#userposts-view").prepend(newUserNameElement);

          const newFollowElement = document.createElement("p");
          newFollowElement.id = "followers-count";
          newFollowElement.textContent = `Followers: ${data.followers_count}, Following: ${data.following_count}`;
          document.querySelector("#userposts-view").prepend(newFollowElement);
        } else if (view === 'followed') {
          document.querySelector("#followingposts-view").style.display = 'block';
          postsContainer = document.querySelector("#followingposts-container");
        }

        postsContainer.innerHTML = '';

        data.posts.forEach(post => {
          const postElement = document.createElement("div");
          postElement.classList.add("post");

          
          editButtonHTML = '<button class="edit-button">Edit</button>';
          

          let likeButtonClass = post.liked_by_current_user ? 'liked-button' : '';
          let likeButtonHTML = `<button class="like-button ${likeButtonClass}">&#128077;</button> <span class="like-count">${post.likes_count}</span>`;

          postElement.innerHTML = `
            <h5>${post.post_owner__first_name} ${post.post_owner__last_name} <a href="#" class="user-link" data-username="${post.post_owner__username}">@${post.post_owner__username}</a></h5>
            <p class="post-content">${post.content}</p>
            <small>${new Date(post.timestamp).toLocaleString()}</small> 
            ${editButtonHTML}
            ${likeButtonHTML}
          `;

          addEventListeners(postElement, post, csrfToken);

          postsContainer.append(postElement);
        });

        // Handle pagination
        document.querySelector('#previous-button').disabled = data.previous_page_number === null;
        document.querySelector('#next-button').disabled = data.next_page_number === null;

        if (!document.querySelector('#previous-button').disabled) {
          document.querySelector('#previous-button').onclick = () => {
            loadPosts(view, data.previous_page_number, username);
          };
        }

        if (!document.querySelector('#next-button').disabled) {
          document.querySelector('#next-button').onclick = () => {
            loadPosts(view, data.next_page_number, username);
          };
        }
      });
  }

  // Load all posts by default
  loadPosts('allposts', 1);
});
