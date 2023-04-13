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
  document.querySelector('#emaildetail-view').style.display = 'none';
  

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emaildetail-view').style.display = 'none';

  // Clear out the mailbox view
  const emailsTable = document.querySelector('#emails-view tbody');
  emailsTable.innerHTML = '';

  // Fetch emails for the specified mailbox
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      console.log("Fetched emails:", emails);

      // Change the text content of title page element
      const mailboxTitle = document.querySelector('#emails-view h3');
      if (mailboxTitle) {
        mailboxTitle.textContent = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`;
      } else {
        console.error('Could not find the mailbox title element');
      }

      emails.forEach(email => {
        const rowElement = document.createElement('tr');
        rowElement.classList.add('email-row');
        
        const senderElement = document.createElement('td');
        senderElement.classList.add('email-sender', 'email-cell'); 

        const subjectElement = document.createElement('td');
        subjectElement.classList.add('email-subject', 'email-cell'); 

        const timestampElement = document.createElement('td');
        timestampElement.classList.add('email-timestamp', 'email-cell'); 

        senderElement.innerHTML = email.sender;
        subjectElement.innerHTML = email.subject;
        timestampElement.innerHTML = email.timestamp;

        rowElement.appendChild(senderElement);
        rowElement.appendChild(subjectElement);
        rowElement.appendChild(timestampElement);

        // Add click event to the row to navigate to the email page
        rowElement.addEventListener('click', () => {
          load_email(email.id);
        });

        // check if email has been read, if it hasn't make sure background is gray (in css)
        if (email.read === false) {
          rowElement.classList.add('unread-email');
        }

        emailsTable.appendChild(rowElement);
      });
    })
    .catch(error => {
      console.error("Error fetching emails:", error);
    });
}


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

function load_email(email_id) {
  console.log('load_email function called');

  // Fetch specific email
  fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      console.log("Fetched emails:", email);

      // assigns a variable to each element on the page
      const subjectElement = document.querySelector('#email-subject');
      const senderElement = document.querySelector('#email-sender');
      const recipientsElement = document.querySelector('#email-recipients');
      const timestampElement = document.querySelector('#email-timestamp');
      const bodyElement = document.querySelector('#email-body');
      const archiveElement = document.querySelector('#archive');

      //updates each element with data from the email
      subjectElement.innerHTML = email.subject;
      senderElement.innerHTML = "Sender: " + email.sender;
      recipientsElement.innerHTML = "Recipients: " + email.recipients;
      timestampElement.innerHTML = email.timestamp;
      bodyElement.innerHTML = email.body;
      archiveElement.value = email.archive;

      // Show the email and hide other views
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#emaildetail-view').style.display = 'block';

      // listen for changes to the archive button
      archiveElement.addEventListener('change', (event) => {
        if (event.target.checked) {
          console.log('The radio button is now selected.');

          fetch(`/emails/${email_id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: true,
            }),
          });
        } else {
          fetch(`/emails/${email_id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: false,
            }),
          });
        }
      });
    });
}
