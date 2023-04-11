document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');


  function compose_email() {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
  
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  
    // Attach the send_email function to the form submit event
    document.querySelector('form').onsubmit = send_email;
  }
  

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
}

function send_email() {
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

  // Listen for submission of the form on the compose page, if submit is pressed run the following code
  document.querySelector('form').onsubmit = (event) => {
    event.preventDefault();
    console.log('Form was submitted'); 

    // set field name variables which will be used later as keys in key:value pairs.
    var recipients = "recipients";
    var subject = "subject";
    var body = "body";

    // create javascript object
    var obj = {};

    // set object variable key : value from the previously created keys and values taken from the form fields.
    obj[recipients] = compose_recipients.value;
    obj[subject] = document.querySelector('#compose-subject').value;
    obj[body] = document.querySelector('#compose-body').value;

    // POST the email
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify(obj)
    })
    .then(response => {
      if (!response.ok) {
        // If the response is not okay, throw the response to be caught in the catch block
        throw response;
      }
      return response.json();
    })
    .then(result => {
      // Print result
      console.log(result.message);
      console.log('Email sent successfully'); // debug console statement
      //if no errors come back load the sent mailbox function TO BE CODED!!!
      load_mailbox('sent');
    })
    .catch(error => {
      if (error instanceof Response) {
        error.json().then(err => {
          console.error('Error:', err.error);
          // Show an error message to the user
        });
      } else {
        console.error('Error:', error.message);
        // Show a generic error message to the user
      }
    });
  }
}


//def 


});
