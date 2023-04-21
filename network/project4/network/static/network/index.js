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



function load_posts() {
    fetch(`/api/posts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: id,
            content: content,
            post_owner:post_owner,
            timestamp: timestamp,
            likes: like_post //this probably needs to be changed.
        })
        .then(response => response.json())
        .then(posts => {
            console.log(posts);
            // Display posts in the table
            // this may need to be hidden
            const table = document.querySelector('.posts-table-template'); 
            // if above is hidden this should be visible once its populated.
            const clonedTable = tableTemplate.cloneNode(true); 
    
            posts.forEach(post => {
                // username, likes and likes count are not in 'post' model so this needs to be looked at later
                const username = document.querySelector(`.username`).textContent = `${post.username}`
                const timestamp = document.querySelector(`.timestamp`).textContent = `${post.timestamp}` 
                const content = document.querySelector(`.content`).textContent = `${post.content}`
                const likes = document.querySelector(`.likes`).textContent = `${post.likes}`  
            })
            
        })
        .catch(error => {
            console.error('Error fetching posts:', error);
        })
    })
}

});
