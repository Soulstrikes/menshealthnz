// header-dropdown.js
const infoBtn = document.getElementById('infoBtn');
const infoDropdown = document.getElementById('infoDropdown');

if (infoBtn && infoDropdown) {
  infoBtn.addEventListener('click', () => {
    infoDropdown.classList.toggle('hidden');
  });

  // Hide dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!infoBtn.contains(e.target) && !infoDropdown.contains(e.target)) {
      infoDropdown.classList.add('hidden');
    }
  });
}
