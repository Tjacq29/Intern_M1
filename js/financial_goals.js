const form = document.getElementById("goalForm");
const goalsList = document.getElementById("goalsList");
const progressSection = document.getElementById("progressSection");

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
      <div>Target: <b>€${goal.target_amount}</b></div>
      <div>Period: ${goal.start_date} to ${goal.end_date}</div>
      <canvas id="gauge-${goal.id}" height="80"></canvas>
    `;
    goalsList.appendChild(div);
    renderGauge(goal);
  });
}

async function renderGauge(goal) {
  // Fetch total saved for this goal period (sum of "Saving" expenses in that period)
  const res = await fetch(`../php/get_goal_progress.php?start=${goal.start_date}&end=${goal.end_date}`);
  const data = await res.json();
  const saved = data.success ? Number(data.saved) : 0;
  const percent = Math.min(100, Math.round((saved / goal.target_amount) * 100));

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
            label: ctx => ctx.label + ": €" + ctx.parsed
          }
        },
        title: {
          display: true,
          text: `Progress: €${saved} / €${goal.target_amount} (${percent}%)`,
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