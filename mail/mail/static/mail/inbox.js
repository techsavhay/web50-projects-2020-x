document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email('compose'));

  // Add the event listener for the compose form submission
  document.querySelector('#compose-form').addEventListener('submit', (event) => {
    event.preventDefault();

    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    fetch('/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
      })
    })
    .then(response => response.json())
    .then(result => {
        console.log(result);
        load_mailbox('sent');
    })
    .catch(error => {
        console.error('Error sending email:', error);
    });
  });

  // By default, load the inbox
  load_mailbox('inbox');
});

// compose email
function compose_email(action, email) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#emaildetail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // reply action
  if (action === 'reply') {
    // fill out recipient and subject
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
  }

}

// load specific mailbox views
function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emaildetail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view h3').innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`;

  // Get emails from the mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Display emails in the table
      const table = document.querySelector('.email-table tbody');
      table.innerHTML = '';

      emails.forEach(email => {
          const row = document.createElement('tr');
          row.innerHTML = `
              <td>${email.sender}</td>
              <td>${email.subject}</td>
              <td>${email.timestamp}</td>
          `;

          // Add event listener for the row
          row.addEventListener('click', () => {
              load_email(email.id);
          });

          // Apply different styles based on read status
          if (email.read) {
              row.style.backgroundColor = 'lightgray';
          }

          // Add the row to the table
          table.append(row);
      });
  });
}

// load a specific email
function load_email(email_id) {
  // Show email details and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#emaildetail-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  

  // Get email details
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      // Display email details
      document.querySelector('#email-subject').innerHTML = `Subject: ${email.subject}`;
      document.querySelector('#email-sender').innerHTML = `From: ${email.sender}`;
      document.querySelector('#email-recipients').innerHTML = `To: ${email.recipients.join(', ')}`;
      document.querySelector('#email-timestamp').innerHTML = email.timestamp;
      document.querySelector('#email-body').innerHTML = email.body;

      // Mark the email as read
      fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
      });
      document.querySelector('#reply').addEventListener('click', () => compose_email('reply', email));

      // Set up the archive button
      const archiveButton = document.querySelector('#archive-button');
      archiveButton.textContent = email.archived ? 'Unarchive' : 'Archive';

      archiveButton.addEventListener('click', () => {
          fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: !email.archived
              })
          })
          .then(() => {
              load_mailbox('inbox');
          });
      });
  });
}

