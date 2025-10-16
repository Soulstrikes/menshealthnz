// js/stageModal.js
const stageInfo = {
  0: "Stage 0: Very early cancer, confined to the prostate and often slow-growing.",
  1: "Stage 1: Small cancer, limited to the prostate, usually found incidentally.",
  2: "Stage 2: Larger tumor confined to the prostate, may require surgery or radiation.",
  3: "Stage 3: Cancer has spread beyond the prostate to nearby tissues.",
  4: "Stage 4: Advanced cancer, spread to lymph nodes or other organs; requires aggressive treatment."
};

function openStageInfo(stage) {
  document.getElementById('stageTitle').textContent = `Stage ${stage}`;
  document.getElementById('stageDescription').textContent = stageInfo[stage];
  document.getElementById('stageModal').classList.remove('hidden');
  document.getElementById('stageModal').classList.add('flex');
}

function closeStageInfo() {
  document.getElementById('stageModal').classList.add('hidden');
  document.getElementById('stageModal').classList.remove('flex');
}
