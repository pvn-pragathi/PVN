function validateForm(event) {
  var aadhaarNumber = document.getElementById("aadhar").value;
  var contact1 = document.getElementById("contact-1").value;
  var contact2 = document.getElementById("contact-2").value;
  var aadhaarPattern = /^\d{4}\s\d{4}\s\d{4}$/; // Aadhaar card format: XXXX XXXX XXXX
  var contactPattern = /^\d{10}$/; // Contact number format: 10 digits
  var errors = 0;

  var aadhaarError = document.getElementById("aadhaarError");
  if (!aadhaarPattern.test(aadhaarNumber)) {
    aadhaarError.textContent = "Please enter a valid Aadhaar card number in the format XXXX XXXX XXXX.";
    errors++;
  } else {
    aadhaarError.textContent = "";
  }

  var contact1Error = document.getElementById("contact1Error");
  if (!contactPattern.test(contact1)) {
    contact1Error.textContent = "Please enter a valid 10-digit contact number for Contact 1.";
    errors++;
  } else {
    contact1Error.textContent = "";
  }

  var contact2Error = document.getElementById("contact2Error");
  if (!contactPattern.test(contact2)) {
    contact2Error.textContent = "Please enter a valid 10-digit contact number for Contact 2.";
    errors++;
  } else {
    contact2Error.textContent = "";
  }

  if (errors > 0) {
    event.preventDefault();
  }
}

const socket = io();

socket.on('newCircular', (circular) => {
  $.notify({
    title: 'New Circular Posted',
    message: circular.title,
    icon: 'fa fa-bell'
  },{
    type: 'info',
    placement: {
      from: 'top',
      align: 'right'
    }
  });
});