// Global variables are defined at the start, as they will be reused throughout the script
const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
let pubData, map, currentUserId, pubsVisitedPercentage;
let markers = [],
    markerMap = new Map(),
    total3starpubs = 0,
    userVisitCount = 0;
let markerClicked = false; // Boolean for tracking if a marker was clicked (to prevent panTo)
let InfoWindow; // Will be used for map marker info window

let bodyElement = document.querySelector('body');
let user_is_logged_in = bodyElement.getAttribute('data-user-logged-in') === 'True';

// Get the welcome screen modal
var modal = document.getElementById("welcomeScreen");

// Display the welcome screen modal when the user is not logged in
if (!user_is_logged_in) {
    modal.style.display = "block";
}

// Function to make fetch calls, adheres to DRY principle
function fetchData(url, method, body) {
    return fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify(body),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        });
}

// Function to fetch pub data using fetchData function 
function fetchPubData() {
    fetchData('/api/pubs/', 'POST', {})
        .then(data => {
            pubData = data.pubs; // Storing the pub data in the global variable for later use
            currentUserId = data.user_id;
            pubStats(currentUserId);
            displayPubs(pubData);
            displayMap(pubData);
        })
        .catch(console.error);
}

// Function to create a form for editing a pub's details
function createForm(pubElement, pubId, fetchPubData, date_visited, content) {
    let form = pubElement.querySelector('.additional-content');

    // Removal of existing elements
    if (form) {
        form.remove();
    }

    form = document.createElement('form');
    form.className = 'additional-content';
    pubElement.appendChild(form);

    // Existing elements are removed
    const contentElement = pubElement.querySelector('.post');
    if (contentElement) {
        contentElement.remove();
    }

    const dateElement = pubElement.querySelector('.date-visited');
    if (dateElement) {
        dateElement.remove();
    }

    // If 'date_visited' exists, reformat it for the editing view
    let newDate = '';
    if (date_visited) {
        let dateParts = date_visited.split("-");
        newDate = dateParts.reverse().join("-");
    }

    // Setting up the form's HTML, with conditional setting of values and placeholders
    const dateValue = date_visited ? `value="${newDate}"` : '';
    const textValue = content ? content : '';
    const placeholderText = !content ? 'placeholder="Space to write a short review, (optional)..."' : '';

    form.innerHTML = `
    <div class="input-row">
      <label for="visit" style="white-space: nowrap;">Date of visit (optional):</label>
      <input type="date" id="date_visited" name="date_visited" ${dateValue}>
    </div>
    <textarea id="content" name="content" maxlength="280" ${placeholderText}>${textValue}</textarea>
    <input type="submit" id="save-visit-button" value="Save visit">
  `;

    // Event listener for Save visit button
    form.addEventListener('submit', event => {
        event.preventDefault();

        const dateVisitedInput = form.querySelector('#date_visited');
        const contentInput = form.querySelector('#content');

        let date_visited = dateVisitedInput.value;
        const content = contentInput.value;

        if (date_visited === '') {
            date_visited = null;
        }

        // POST request to save visit
        fetchData('/api/save_visit/', 'POST', {
            date_visited: date_visited,
            content: content,
            pub_id: pubId,
        }).then(data => {
            pubElement.classList.add('visited');

            // Fetching the latest pub data after saving the visit
            return fetchData('/api/pubs/', 'POST', {});

        }).then(data => {
            // Updating pubData with the latest data and then updating the displayed pubs
            pubData = data.pubs;
            updateDisplayedPubs();
            displayMap(pubData)

            // Updating the pint glass animation
            pubStats(currentUserId);

        }).catch(error => {
            console.error('Error:', error);
        });

        dateVisitedInput.value = '';
        contentInput.value = '';
    });
}


// function to take pub data and display it, including adding edit and delete buttons
function displayPubs(data) {
    // Sorting pubs alphabetically. Good for UX.
    const sorted_pubs = data.sort((a, b) => a.pub.name < b.pub.name ? -1 : a.pub.name > b.pub.name ? 1 : 0);

    // Grab the pubs container from DOM.
    const pubsContainer = document.querySelector('#pubs-container');
    // Clean slate - empty the container before adding new pubs.
    pubsContainer.innerHTML = '';

    // Keeping track of current expanded pub. Useful for managing UI state.
    let expandedPub = null;

    // Looping over pubs, creating DOM elements for each.
    sorted_pubs.forEach(item => {
        const pub = item.pub;
        const post = item.posts[item.posts.length - 1];

        const name = pub.name;
        const address = pub.address;
        const custom_pub_id = pub.custom_pub_id;
        const url = pub.url;

        const pubElement = document.createElement('div');
        pubElement.classList.add('pub');

        pubElement.id = custom_pub_id;

        pubElement.innerHTML = `
    <p class="pub-name">${name}</p>
    <p class="pub-address">${address}</p>
  `;

        let userHasVisited = pub.users_visited.includes(currentUserId);

        if (userHasVisited) {
            pubElement.classList.add('visited');
        } else {
            pubElement.classList.remove('visited');
        }

        // Adding click event for each pub.
        pubElement.addEventListener('click', event => {
            const clickedElement = event.target;
            const clickedParent = clickedElement.parentElement;

            // Exclude certain elements from click listener. We don't want everything to respond to click events!
            if (
                !clickedElement.classList.contains('additional-content') &&
                !clickedElement.classList.contains('edit-button') &&
                !clickedElement.classList.contains('delete-button') &&
                !clickedParent.classList.contains('additional-content') &&
                !clickedParent.classList.contains('edit-button') &&
                !clickedParent.classList.contains('delete-button') &&
                !clickedParent.classList.contains('input-row')
            ) {
                if (expandedPub && expandedPub !== pubElement) {
                    expandedPub.classList.remove('pub-expanded');
                    const additionalContent = expandedPub.querySelector('.additional-content');
                    if (additionalContent) {
                        additionalContent.remove();
                    }
                    expandedPub.style.height = 'auto';
                }

                const isExpanded = pubElement.classList.contains('pub-expanded');

                pubElement.classList.toggle('pub-expanded', !isExpanded);

                // Map interactions: zoom and pan to clicked marker.
                if (!isExpanded && !markerClicked) {
                    const clickedMarker = markerMap.get(custom_pub_id);
                    if (clickedMarker) {
                        map.setZoom(7);
                        setTimeout(function() {
                            map.panTo(clickedMarker.getPosition());
                            setTimeout(function() {
                                map.setZoom(11);
                            }, 500);
                        }, 500);
                    }
                }

                // If pub is expanded and visited, show review and add edit & delete buttons.
                if (pubElement.classList.contains('pub-expanded')) {
                    if (userHasVisited) {
                        if (!pubElement.querySelector('.post')) {
                            const content = post.content;
                            let date_visited = post.date_visited;
                            if (date_visited == null) {
                                date_visited = '';
                            }

                            const contentElement = document.createElement('p');
                            contentElement.classList.add('post');
                            contentElement.innerHTML = `<h6>Date visited:</h6> ${date_visited}<br><p><h6>Review:</h6> ${content}</p>`;
                            pubElement.appendChild(contentElement);

                            const editButton = document.createElement('button');
                            editButton.textContent = 'Edit Post';
                            editButton.classList.add('edit-button');
                            contentElement.appendChild(editButton);

                            const deleteButton = document.createElement('button');
                            deleteButton.textContent = 'Delete post & visit';
                            deleteButton.classList.add('delete-button');
                            contentElement.appendChild(deleteButton);

                            // Event listeners for 'edit' and 'delete' buttons.
                            editButton.addEventListener('click', function() {
                                createForm(pubElement, pub.id, fetchPubData, date_visited, content);
                            });

                            deleteButton.addEventListener('click', function() {
                                fetchData('/api/delete_visit/', 'POST', {
                                    pub_id: pub.id,
                                }).then(data => {
                                    return fetchData('/api/pubs/', 'POST', {});
                                }).then(data => {
                                    pubData = data.pubs;
                                    updateDisplayedPubs();
                                    displayMap(pubData);

                                    console.log("pubsVisitedPercentage:", pubsVisitedPercentage);

                                    pubStats(currentUserId);

                                }).catch(error => {
                                    console.error('There has been a problem with your fetch operation:', error);
                                });
                            });
                        }
                    }
                    // If pub not visited, display form for adding a review.
                    else {
                        if (!pubElement.querySelector('.additional-content')) {
                            createForm(pubElement, pub.id, fetchPubData);
                        }
                    }

                    expandedPub = pubElement;
                } else {
                    pubElement.style.height = 'auto';
                    const additionalContent = pubElement.querySelector('.additional-content');
                    const post = pubElement.querySelector('.post');
                    if (additionalContent) {
                        additionalContent.remove();
                    }
                    if (userHasVisited) {
                        post.remove();
                    }
                }
            }
        });
        // Add the new pub div to the container.
        pubsContainer.appendChild(pubElement);
    });
}

// Function to display the map with markers.
function displayMap(pubData) {
    console.log(pubData);
    // Clear existing map markers.
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }

    // Clear the markers array.
    markers = [];

    // Add a marker for each pub
    pubData.forEach(item => {
        const pub = item.pub;
        const name = pub.name;
        const lat = pub.latitude;
        const lng = pub.longitude;
        const custom_pub_id = pub.custom_pub_id;
        const url = pub.url;
        // DEBUG PRINT STATEMENT console.log("Pub:", name, "Longitude:", lng, "Lattitude:", lat);


        if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
            console.log("Pub", name, "does not have valid latitude and longitude data.");
            return; // Skip the rest of this iteration and continue with the next item.
        }

        let icon;
        let userhasvisited = pub.users_visited.includes(currentUserId);
        if (userhasvisited) {
            icon = '/static/images/BEERmarker3.png';
        } else {
            icon = '/static/images/LIGHTBLUEmarker3.png';
        }

        let marker = new google.maps.Marker({
            position: {
                lat: lat,
                lng: lng
            },
            map,
            title: name,
            icon: icon,
        });

        // add custom_id_property to the map marker
        marker.custom_pub_id = custom_pub_id;

        // set custom pub id as a key and the marker as the value for use in panTo map
        markerMap.set(custom_pub_id, marker);

        // join the pub name and url and other text in preparation for populating map marker info windows
        const infoWindowContent = `
  <div class="infoWindowHTML" style="text-align: center;">
    <p><a class='urlHTML' href="${url}" target="_blank" style="font-size:18px;font-family: 'Cabin', sans-serif; ">
     ${name}</a><br></p>
    <p class='infoWindowmaintext' style="font-size:13px; font-family: 'Cabin', sans-serif;word-wrap: break-word;">(The link takes you to the pub's inventory listing at CAMRA where you can find out more.)</p>
  </div>`;


        let InfoWindow = new google.maps.InfoWindow({
            content: infoWindowContent,
        })

        marker.addListener("click", function() {
            markerClicked = true;
            // Set content and open the InfoWindow
            InfoWindow.setContent(infoWindowContent);
            InfoWindow.open(map, marker);
            scrollToPub(custom_pub_id);
            markerClicked = false;
        });

        // Store the marker for future use
        markers.push(marker);
    })

    // Sets the map on all markers in the array.
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

// clears the searchbox, scrolls the pub whose map marker was clicked to the top of the window and then clicks it.
function scrollToPub(custom_pub_id) {
    document.getElementById('searchInput').value = "";

    // Manually trigger 'input' event
    const event = new Event('input', {
        bubbles: true,
        cancelable: true,
    });
    searchInput.dispatchEvent(event);

    const selectedPub = document.getElementById(custom_pub_id);
    selectedPub.scrollIntoView({
        behavior: "smooth",
        block: "start"
    })
    selectedPub.click()
}

// displays pubs whose name or address is a match or partial match to the search box value.
function updateDisplayedPubs() {
    // Get the current filter value from the search input
    var searchInput = document.getElementById('searchInput');
    var filter = searchInput.value.toUpperCase();

    // Filter the pubs and display the ones that match the filter
    const filteredpubData = pubData.filter(pub =>
        pub.pub.name.toUpperCase().includes(filter) ||
        pub.pub.address.toUpperCase().includes(filter)
    );

    displayPubs(filteredpubData);
}


// search box functionality, to search dynamically
function dynamicSearch() {
    updateDisplayedPubs();
}

//creates stats for how many pubs the user has visited, out of XXX many and others.
function pubStats(userid) {
    total3starpubs = pubData.length;
    console.log("total3starpubs:", total3starpubs)

    userVisitCount = pubData.filter(pub => pub.pub.users_visited.includes(userid)).length;
    console.log("userVisitCount:", userVisitCount);

    pubsVisitedPercentage = Math.round(((userVisitCount / total3starpubs) * 100) * 10) / 10; //working out percentage and rounding it to nearest whole number.
    console.log("pubsVisitedPercentage:", pubsVisitedPercentage);

    // update the pint glass animation now
    updatePintGlassAnimation();

    return {
        total3starpubs,
        userVisitCount,
        pubsVisitedPercentage
    };
}

function updatePintGlassAnimation() {
    const water = document.querySelector("#animation-water");
    const animationText = document.querySelector("#animation-text");

    let percentage = pubsVisitedPercentage / 100;
    if (percentage > 1) {
        percentage = 1;
    } else if (percentage < 0) {
        percentage = 0;
    }
    water.style.transform = `scaleY(${percentage})`;
    animationText.innerHTML = `${pubsVisitedPercentage}%`;

    const pintBottomContainer = document.querySelector("#pint-bottomcontainer");
    pintBottomContainer.innerHTML = `<br /><h5>(That's ${userVisitCount} out of ${total3starpubs} pubs.)</h5>`
}

// initilise the map
window.initMap = function() {
    map = new google.maps.Map(document.getElementById('map-container'), {
        mapId: '5d9e03b671899eb4',
        center: {
            lat: 54.09341667,
            lng: -2.89477778
        },
        zoom: 6
    });
    // Initialize InfoWindow 
    InfoWindow = new google.maps.InfoWindow();
}

// calls main function
document.addEventListener('DOMContentLoaded', (event) => {
    console.log("user_is_logged_in = ", user_is_logged_in, " Type: ", typeof user_is_logged_in);

    // Check if user is logged in before fetching pub data
    if (user_is_logged_in) {
        fetchPubData();
        console.log("fetchPubData was called");
    }
});


// only runs google maps script if user is logged in.
if (user_is_logged_in) {
    // Create the script tag, set the appropriate attributes
    var script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAyo_wEPw--GZf5e8ztb5YQiH8lIOCiQr4&callback=initMap';
    script.defer = true;

    // Append the 'script' element to 'head'
    document.head.appendChild(script);
}