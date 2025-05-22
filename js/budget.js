// public/js/budget.js

document.addEventListener('DOMContentLoaded', () => {
  let currentStep = 1;
  const totalSteps = 5;

  function showStep(step) {
    document.querySelectorAll('.form-step').forEach((el, index) => {
      el.classList.toggle('d-none', index !== (step - 1));
    });
  }

  window.nextStep = function () {
    if (currentStep < totalSteps) {
      currentStep++;
      showStep(currentStep);
    }
  };

  window.prevStep = function () {
    if (currentStep > 1) {
      currentStep--;
      showStep(currentStep);
    }
  };

  const activitySelect = document.getElementById('activity');
  if (activitySelect) {
    activitySelect.addEventListener('change', () => {
      const costGroup = document.getElementById('activityCostGroup');
      costGroup.classList.toggle('d-none', activitySelect.value !== 'Yes');
      document.getElementById('activityCost').required = activitySelect.value === 'Yes';
    });
  }

  const form = document.getElementById('budgetForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      try {
        const response = await fetch('../php/save_budget.php', {
          method: 'POST',
          body: formData
        });
        const result = await response.json();
        if (result.success) {
          alert('Budget saved successfully!');
          window.location.href = 'dashboard.html';
        } else {
          alert('Error saving budget: ' + result.message);
        }
      } catch (err) {
        alert('An error occurred while submitting the form.');
        console.error(err);
      }
    });
  }

  // Initialize the first step
  showStep(currentStep);
});
