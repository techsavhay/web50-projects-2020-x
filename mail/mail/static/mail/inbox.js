console.log("Inbox.js loaded");

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded event triggered'); 

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Add submit event listener to the compose form
  document.querySelector('#compose-form').addEventListener('submit', function(event) {
    // Prevent default submission
    event.preventDefault();

    // Send email
    send_email();

    console.log('Submit event triggered');
  });

});

function compose_email() {
  console.log('compose_email function called'); 

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function load_mailbox(mailbox) {
  console.log(`load_mailbox function called with mailbox: ${mailbox}`); 

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

// API request to get the emails from the relevant mailbox
fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Print emails
    console.log(emails);

    // Loop through the array of email objects
    emails.forEach(email => {
      // Access properties of each email object
      const id = email.id;
      const sender = email.sender;
      const recipients = email.recipients;
      const subject = email.subject;
      const timestamp = email.timestamp;
      const read = email.read;
      const archived = email.archived;

      //  properties, e.g., create DOM elements and display them
      console.log(id, sender, recipients, subject, timestamp, read, archived);
    });

    // ... do something else with emails ...
  });




};



function send_email() {
  console.log('send_email function called'); 

  // Selects the submit button to be used later.
  const submit = document.querySelector('input[type="submit"]');
  const compose_recipients = document.querySelector('#compose-recipients');

  // Disable submit button by default so it doesn't submit blank emails:
  submit.disabled = true;

  // Listen for input to be typed into the compose_recipients input field
  compose_recipients.onkeyup = () => {
    if (compose_recipients.value.length > 0) {
        submit.disabled = false;
    }
    else {
        submit.disabled = true;
    }
  }

  // Remove the previous event listener and add a new one
  document.querySelector('#compose-form').removeEventListener('submit', form_submit_handler);
  document.querySelector('#compose-form').addEventListener('submit', form_submit_handler);

  function form_submit_handler(event) {
    console.log('Form submit handler called'); // New console log
    event.preventDefault();

    var recipients = "recipients";
    var subject = "subject";
    var body = "body";

    var obj = {};
    obj[recipients] = compose_recipients.value;
    obj[subject] = document.querySelector('#compose-subject').value;
    obj[body] = document.querySelector('#compose-body').value;

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify(obj)
    })
    .then(response => {
      if (!response.ok) {
        throw response;
      }
      return response.json();
    })
    .then(result => {
      console.log(result.message);
      console.log('Email sent successfully');
      load_mailbox('sent');
    })
    .catch(error => {
      if (error instanceof Response) {
        error.json().then(err => {
          console.error('Error:', err.error);
        });
      } else {
        console.error('Error:', error.message);
      }
    });
  }
}

