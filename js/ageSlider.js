// js/ageSlider.js
function updateAgeInfo(age) {
  let displayAge = age;
  if (age == 80) {
    displayAge = "80+";
  }
  document.getElementById('ageValue').innerText = displayAge;

  let message = "";

  if (age < 40) {
    message = "Very rare, but a great time to learn about your prostate and stay informed!";
  } else if (age < 50) {
    message = "Risk begins to increase — it’s smart to learn and stay aware.";
  } else if (age < 60) {
    message = "This is when regular prostate checks become important.";
  } else {
    message = "Most prostate cancer cases are diagnosed here — screening is vital.";
  }

  document.getElementById('ageMessage').innerText = message;
}
