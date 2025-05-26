document.addEventListener('DOMContentLoaded', () => {
  let currentStep = 1;
  const totalSteps = 7;

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

  // Toggle activity cost field
  const activitySelect = document.getElementById('activity');
  if (activitySelect) {
    activitySelect.addEventListener('change', () => {
      const costGroup = document.getElementById('activityCostGroup');
      costGroup.classList.toggle('d-none', activitySelect.value !== 'Yes');
      document.getElementById('activityCost').required = activitySelect.value === 'Yes';
    });
  }

  // ✅ Add custom expense inputs dynamically
  const addOtherBtn = document.getElementById('addOtherBtn');
  if (addOtherBtn) {
    addOtherBtn.addEventListener('click', () => {
      const container = document.getElementById('otherExpenses');
      const div = document.createElement('div');
      div.classList.add('d-flex', 'gap-2', 'mb-2');

      const input1 = document.createElement('input');
      input1.type = 'text';
      input1.className = 'form-control';
      input1.name = 'customLabel[]';
      input1.placeholder = 'Expense name (e.g. Netflix)';
      input1.required = true;

      const input2 = document.createElement('input');
      input2.type = 'number';
      input2.className = 'form-control';
      input2.name = 'customValue[]';
      input2.placeholder = 'Amount (e.g. 100000)';
      input2.required = true;

      div.appendChild(input1);
      div.appendChild(input2);
      container.appendChild(div);
    });
  }

  // Submit the form
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
          window.location.href = 'budget_chart.html';
        } else {
          alert('Error saving budget: ' + result.message);
        }
      } catch (err) {
        alert('An error occurred while submitting the form.');
        console.error(err);
      }
    });
  }

  showStep(currentStep);
});
function generateGraphFromForm() {
  const labels = [];
  const data = [];

  const housingCost = parseFloat(document.getElementById('housingCost')?.value || 0);
  const transportCost = parseFloat(document.getElementById('transportCost')?.value || 0);
  const activityCost = parseFloat(document.getElementById('activityCost')?.value || 0);
  const savings = parseFloat(document.getElementById('savings')?.value || 0);

  if (housingCost > 0) {
    labels.push('Housing');
    data.push(housingCost);
  }
  if (transportCost > 0) {
    labels.push('Transport');
    data.push(transportCost);
  }
  if (!isNaN(activityCost) && activityCost > 0) {
    labels.push('Activity');
    data.push(activityCost);
  }
  if (savings > 0) {
    labels.push('Savings');
    data.push(savings);
  }

  // Get other expenses
  const customLabels = document.getElementsByName('customLabel[]');
  const customValues = document.getElementsByName('customValue[]');
  for (let i = 0; i < customLabels.length; i++) {
    const label = customLabels[i].value.trim();
    const value = parseFloat(customValues[i].value || 0);
    if (label && value > 0) {
      labels.push(label);
      data.push(value);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'budgetChart';
  document.body.appendChild(canvas); // Or insert into a <div id="chartArea"></div>

  new Chart(canvas, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          "#3b82f6", "#10b981", "#f97316", "#8b5cf6", "#facc15", "#ec4899", "#6b7280", "#4ade80"
        ]
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Your Personalized Budget Plan'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}
