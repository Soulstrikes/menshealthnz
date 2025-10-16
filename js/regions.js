function showRegion(regionId) {
  const regions = [
    'northland','auckland','waikato','bayofplenty','gisborne',
    'hawkesbay','taranaki','wanganui','wellington','marlborough',
    'nelsontasman','westcoast','canterbury','otago','southland'
  ];

  // Hide all regions
  regions.forEach(r => document.getElementById(r).classList.add('hidden'));

  // Show selected region
  document.getElementById(regionId).classList.remove('hidden');

  // Remove active class from all buttons
  document.querySelectorAll('.region-btn').forEach(btn => btn.classList.remove('active'));

  // Add active class to the clicked button
  document.querySelector(`button[onclick="showRegion('${regionId}')"]`).classList.add('active');
}

// Highlight Auckland by default
document.addEventListener('DOMContentLoaded', () => {
  showRegion('auckland');
});
