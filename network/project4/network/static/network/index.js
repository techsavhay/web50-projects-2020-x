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
                'X-CSRFToken': csrfToken // Must include the CSRF token in the headers
            },
            body: JSON.stringify({
                content: content
            })
        })
            .then(response => {
                if (response.ok) {
                    // If the request was successful, reload the page
                    location.reload();
                } else {
                    // If there is an error, show the error message in the console
                    console.error('Error saving post:', response.statusText);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    });



    function loadPosts(view, page_number) {
        const url = `/api/posts/${view}/${page_number}/`;
    
        fetch(url)
            .then(response => response.json())
            .then(data => {
                // Clear the existing posts in the DOM
                const postsContainer = document.querySelector("#posts-container");
                postsContainer.innerHTML = '';
    
                // Render the received posts
                data.posts.forEach(post => {
                    // Create the post element (e.g., a div or a list item)
                    const postElement = document.createElement("div");
                    postElement.classList.add("post");
    
                    // Populate the post element with the post data (id, content, post_owner__username, timestamp, etc.)
                    postElement.innerHTML = `
                    <h5>${post.post_owner__first_name} ${post.post_owner__last_name} @${post.post_owner__username}</h5>
                        <p>${post.content}</p>
                        <small>${new Date(post.timestamp).toLocaleString()} </small> <button class="like-button">&#128077;</button> <span>${post.likes_count}</span>
                    `;
    
                    // Fetch like button using the class instead of an id
                    const likeButton = postElement.querySelector('.like-button');
    
                    // Add the event listener to the like button
                    likeButton.addEventListener('click', () => {
                        fetch(``)
                        likeButton.classList.toggle('liked-button');
                    });
    
                    // Append the post element to the posts container
                    postsContainer.appendChild(postElement);
                });
    
                // Update the pagination controls (e.g., next and previous buttons)
                const prevButton = document.querySelector("#previous-button");
                const nextButton = document.querySelector("#next-button");
    
                if (data.has_previous) {
                    prevButton.disabled = false;
                    prevButton.dataset.page = data.previous_page_number;
                } else {
                    prevButton.disabled = true;
                }
    
                if (data.has_next) {
                    nextButton.disabled = false;
                    nextButton.dataset.page = data.next_page_number;
                } else {
                    nextButton.disabled = true;
                }
            })
            .catch(error => {
                console.error("Error fetching posts:", error);
            });
    }
    



    // Keep the inner DOMContentLoaded event listener
    document.querySelector("#allposts-link").addEventListener("click", (event) => {
        event.preventDefault();
        loadPosts("allposts", 1);
    });

    document.querySelector("#myposts-link").addEventListener("click", (event) => {
        event.preventDefault();
        loadPosts("myposts", 1);
    });

    document.querySelector("#followed-link").addEventListener("click", (event) => {
        event.preventDefault();
        loadPosts("followed", 1);
    });

    // Load the initial set of posts when the page loads
    loadPosts("allposts", 1);
});
