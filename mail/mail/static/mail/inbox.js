document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
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
  const submit = document.querySelector('submit');
  const compose_recipients  = document.querySelector('#compose-recipients');

  // Disable submit button by default so it doesnt submit blank emails:
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

  // Listen for submission of the form on the compose page
  document.querySelector('form').onsubmit = () => {

    
    // get the value of the recipient, subject and body fields
    const recipients = compose_recipients.value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    
    obj[recipients]

    // POST the email
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: 'recipients',
          subject: 'subject',
          body: 'body'
      })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
    });
  }

}