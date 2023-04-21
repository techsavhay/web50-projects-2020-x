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
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(response => response.json())
        .then(posts => {
            console.log(posts);
    
            posts.forEach(post => {
                // Clone the table structure
                const tableTemplate = document.querySelector('#posts-table-template');
                const clonedTable = tableTemplate.cloneNode(true);
                clonedTable.style.display = ''; // Make the cloned table visible
    
                // Update the content of the cloned table. some of these variables are not from post model.
                clonedTable.querySelector('.username').textContent = `${post.username}`;
                clonedTable.querySelector('.timestamp').textContent = `${post.timestamp}`;
                clonedTable.querySelector('.content').textContent = `${post.content}`;
                clonedTable.querySelector('.likes').textContent = `${post.likes}`;
                
                // Append the populated cloned table to the container
                document.querySelector("#allposts-view").appendChild(clonedTable);
            });
        })
        .catch(error => {
            console.error('Error fetching posts:', error);
        });
    }
    

});
