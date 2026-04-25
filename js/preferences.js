/* ═══════════════════════════════════════════════
   PREFERENCES.JS — User preferences manager
   ═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  loadPreferences();
  initStyleOptions();
  initBudgetOptions();
  initInterestChips();
  initSaveButton();
});

function loadPreferences() {
  const prefs = JSON.parse(localStorage.getItem('preferences') || '{}');

  // Restore travel style
  if (prefs.travelStyle) {
    document.querySelectorAll('.style-option').forEach(opt => {
      if (opt.dataset.style === prefs.travelStyle) opt.classList.add('selected');
    });
  }

  // Restore budget preference
  if (prefs.budgetPref) {
    document.querySelectorAll('.budget-option').forEach(opt => {
      if (opt.dataset.budget === prefs.budgetPref) opt.classList.add('selected');
    });
  }

  // Restore interests
  if (prefs.interests && prefs.interests.length) {
    document.querySelectorAll('.interest-chip').forEach(chip => {
      if (prefs.interests.includes(chip.dataset.interest)) chip.classList.add('selected');
    });
  }
}

function initStyleOptions() {
  document.querySelectorAll('.style-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.style-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });
}

function initBudgetOptions() {
  document.querySelectorAll('.budget-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.budget-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });
}

function initInterestChips() {
  document.querySelectorAll('.interest-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
    });
  });
}

function initSaveButton() {
  const saveBtn = document.getElementById('save-prefs');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', () => {
    const travelStyle = document.querySelector('.style-option.selected')?.dataset.style || '';
    const budgetPref = document.querySelector('.budget-option.selected')?.dataset.budget || '';
    const interests = Array.from(document.querySelectorAll('.interest-chip.selected')).map(c => c.dataset.interest);

    const prefs = { travelStyle, budgetPref, interests };
    localStorage.setItem('preferences', JSON.stringify(prefs));
    showToast('Preferences saved successfully!');
  });
}


