function validateForm(event) {
  var aadhaarNumber = document.getElementById("aadhar").value;
  var contact1 = document.getElementById("contact-1").value;
  var contact2 = document.getElementById("contact-2").value;
  var aadhaarPattern = /^\d{4}\s\d{4}\s\d{4}$/; // Aadhaar card format: XXXX XXXX XXXX
  var contactPattern = /^\d{10}$/; // Contact number format: 10 digits
  var errors = 0;

  var aadhaarError = document.getElementById("aadhaarError");
  if (!aadhaarPattern.test(aadhaarNumber)) {
    aadhaarError.textContent =
      "Please enter a valid Aadhaar card number in the format XXXX XXXX XXXX.";
    errors++;
  } else {
    aadhaarError.textContent = "";
  }

  var contact1Error = document.getElementById("contact1Error");
  if (!contactPattern.test(contact1)) {
    contact1Error.textContent =
      "Please enter a valid 10-digit contact number for Contact 1.";
    errors++;
  } else {
    contact1Error.textContent = "";
  }

  var contact2Error = document.getElementById("contact2Error");
  if (!contactPattern.test(contact2)) {
    contact2Error.textContent =
      "Please enter a valid 10-digit contact number for Contact 2.";
    errors++;
  } else {
    contact2Error.textContent = "";
  }

  if (errors > 0) {
    event.preventDefault();
  }
}

function calculateGrade(percentage) {
  if (percentage >= 91) {
    return "A1";
  } else if (percentage >= 81) {
    return "A2";
  } else if (percentage >= 71) {
    return "B1";
  } else if (percentage >= 61) {
    return "B2";
  } else if (percentage >= 51) {
    return "C1";
  } else if (percentage >= 41) {
    return "C2";
  } else if (percentage >= 35) {
    return "D";
  } else if (percentage >= 2) {
    return "E";
  } else if (percentage >= 0) {
    return "AB";
  }
}

function calculateGPA(marks) {
  const halvedMarks = Object.values(marks).map((mark) => mark / 2);
  const totalHalvedMarks = halvedMarks.reduce((acc, val) => acc + val, 0);
  return totalHalvedMarks / 6;
}

function roundToOneDecimal(number) {
  return Math.round(number * 10) / 10;
}
