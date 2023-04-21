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
    })
}

});
