document.addEventListener('DOMContentLoaded', function () {

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
                    
                    const likeCountSpan = postElement.querySelector('span');
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
                // Hide all views
                document.querySelector("#allposts-view").style.display = 'none';
                document.querySelector("#userposts-view").style.display = 'none';
    
                // Show the appropriate view
                if (view === 'allposts') {
                    document.querySelector("#allposts-view").style.display = 'block';
                } else if (view === 'userposts') {
                    document.querySelector("#userposts-view").style.display = 'block';
                    
                        // Display the user's first name
                        const userNameElement = document.createElement("h2");
                        userNameElement.textContent = `${data.posts[0].post_owner__first_name} ${data.posts[0].post_owner__last_name}'s Profile`;
                        document.querySelector("#userposts-view").prepend(userNameElement);
                    
                }
    
                const postsContainer = view === 'allposts' ? document.querySelector("#posts-container") : document.querySelector("#userposts-container");
                postsContainer.innerHTML = '';
    
                data.posts.forEach(post => {
                    const postElement = document.createElement("div");
                    postElement.classList.add("post");
    
                                        postElement.innerHTML = `
                        <h5>${post.post_owner__first_name} ${post.post_owner__last_name} <a href="#" class="user-link" data-username="${post.post_owner__username}">@${post.post_owner__username}</a></h5>
                        <p>${post.content}</p>
                        <small>${new Date(post.timestamp).toLocaleString()} </small> <button class="like-button ${post.liked_by_current_user ? 'liked-button' : ''}">&#128077;</button> <span>${post.likes_count}</span>
                    `;

                    addEventListeners(postElement, post, csrfToken);

                    postsContainer.append(postElement);
                });

                // Handle pagination
                document.querySelector('#previous-button').disabled = data.pagination.previous === null;
                document.querySelector('#next-button').disabled = data.pagination.next === null;

                if (!document.querySelector('#previous-button').disabled) {
                    document.querySelector('#previous-button').onclick = () => {
                        loadPosts(view, data.pagination.previous, username);
                    };
                }

                if (!document.querySelector('#next-button').disabled) {
                    document.querySelector('#next-button').onclick = () => {
                        loadPosts(view, data.pagination.next, username);
                    };
                }
            });
    }

    // Load the all posts view by default
    loadPosts('allposts', 1);
});