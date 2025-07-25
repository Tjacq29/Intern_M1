const form = document.getElementById("goalForm");
const goalsList = document.getElementById("goalsList");
const progressSection = document.getElementById("progressSection");

// Récupère la devise choisie (Rp ou €)
const currentCurrency = localStorage.getItem('selectedCurrency') || '€';
function getTranslation(key) {
  const lang = localStorage.getItem('lang') || 'en';
  return (window.translations && window.translations[lang] && window.translations[lang][key]) || key;
}
function formatCurrency(amount, currency = currentCurrency) {
  if (currency === 'IDR' || currency === 'Rp') {
    return 'Rp ' + Number(amount).toLocaleString('id-ID', {minimumFractionDigits: 0});
  } else {
    return '€' + Number(amount).toLocaleString('fr-FR', {minimumFractionDigits: 2});
  }
}

async function fetchGoals() {
  const res = await fetch("../php/get_goals.php");
  const data = await res.json();
  if (data.success) {
    renderGoals(data.goals);
  }
}

function renderGoals(goals) {
  goalsList.innerHTML = "";
  if (!goals.length) {
    goalsList.innerHTML = "<div class='alert alert-info'>No goals set yet.</div>";
    progressSection.innerHTML = "";
    return;
  }
  goals.forEach(goal => {
    const div = document.createElement("div");
    div.className = "card mb-3 p-3";
    div.innerHTML = `
      <h5>${goal.goal_name}</h5>
      <div><span class="targetLabel">Target:</span> <b>${formatCurrency(goal.target_amount)}</b></div>
      <div><span class="periodLabel">Period:</span> ${goal.start_date} to ${goal.end_date}</div>
      <canvas id="gauge-${goal.id}" height="80"></canvas>
    `;
    goalsList.appendChild(div);
    renderGauge(goal);
  });
}
async function renderGauge(goal) {
  // Fetch total saved for this goal period (sum of "Saving" expenses in that period)
  const res = await fetch(`../php/get_goal_progress.php?goal_id=${goal.id}&start=${goal.start_date}&end=${goal.end_date}`);
  const data = await res.json();
  const saved = data.success ? Number(data.saved) : 0;
  const percent = goal.target_amount > 0 ? Math.min(100, Math.round((saved / goal.target_amount) * 100)) : 0;

  const ctx = document.getElementById(`gauge-${goal.id}`).getContext("2d");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Saved", "Remaining"],
      datasets: [{
        data: [saved, Math.max(goal.target_amount - saved, 0)],
        backgroundColor: [
          percent < 50 ? "#dc3545" : percent < 80 ? "#ffc107" : "#198754", // red, yellow, green
          "#e9ecef"
        ],
        borderWidth: 0
      }]
    },
    options: {
      rotation: -90,
      circumference: 180,
      cutout: "75%",
      animation: {
        animateRotate: true,
        duration: 1200
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ctx.label + ": " + formatCurrency(ctx.parsed)
          }
        },
        title: {
          display: true,
          text: `${getTranslation('progressLabel')} ${formatCurrency(saved)} / ${formatCurrency(goal.target_amount)} (${percent}%)`,
          font: { size: 16 }
        }
      }
    }
  });
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  const goalName = document.getElementById("goalName").value;
  const targetAmount = document.getElementById("targetAmount").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const res = await fetch("../php/save_goal.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goalName, targetAmount, startDate, endDate })
  });
  const data = await res.json();
  if (data.success) {
    form.reset();
    fetchGoals();
  } else {
    alert(data.message || "Error saving goal.");
  }
});

document.addEventListener("DOMContentLoaded", fetchGoals);