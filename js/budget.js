let chartInstance = null;
let currentChartType = "pie"; // default

function getRandomColor() {
  const colors = [
    "#3b82f6", "#f97316", "#16a34a", "#facc15", "#8b5cf6", "#ef4444",
    "#10b981", "#a855f7", "#f472b6", "#fb923c", "#4ade80", "#fcd34d",
    "#6366f1", "#dc2626", "#22d3ee", "#e879f9", "#84cc16", "#f43f5e",
    "#0ea5e9", "#14b8a6", "#9ca3af", "#7c3aed", "#c084fc", "#d97706"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function updateChart() {
  const budgetInput = document.getElementById("monthlyBudget");
  if (!budgetInput) return;

  const budget = parseFloat(budgetInput.value || 0);
  const labels = [];
  const values = [];
  const colors = [];
  let totalExpenses = 0;

  document.querySelectorAll(".expense-row").forEach(row => {
    const label = row.querySelector(".expense-label")?.value;
    const value = parseFloat(row.querySelector(".expense-amount")?.value || 0);
    if (label && value > 0) {
      labels.push(label);
      values.push(value);
      totalExpenses += value;
      colors.push(getRandomColor());
    }
  });

  if (budget > totalExpenses && currentChartType === "pie") {
    labels.push("Remaining");
    values.push(budget - totalExpenses);
    colors.push("#e5e7eb");
  }

  const canvas = document.getElementById("budgetChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  if (chartInstance) chartInstance.destroy();

  const dataset = {
    data: values,
    backgroundColor: currentChartType === "line" ? "transparent" : colors,
    borderColor: currentChartType === "line" ? "#0d6efd" : "#fff",
    borderWidth: currentChartType === "line" ? 2 : 1,
    pointBackgroundColor: colors,
    pointRadius: currentChartType === "line" ? 5 : undefined,
    pointHoverRadius: currentChartType === "line" ? 7 : undefined,
    tension: currentChartType === "line" ? 0.4 : 0,
    fill: false
  };

  const chartConfig = {
    type: currentChartType,
    data: {
      labels: labels,
      datasets: [dataset]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "Real-Time Budget Allocation"
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percent = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} (${percent}%)`;
            }
          }
        }
      },
      scales: currentChartType === "bar" || currentChartType === "line"
        ? {
            x: { stacked: false },
            y: { beginAtZero: true }
          }
        : undefined
    }
  };

  chartInstance = new Chart(ctx, chartConfig);
}

function addExpenseRow(label = '', amount = '', isFixed = false) {
  const table = document.getElementById("expenseTableBody");
  if (!table) return;

  const row = document.createElement("tr");
  row.classList.add("expense-row");

  row.innerHTML = `
    <td><input type="text" class="form-control expense-label" value="${label}" required></td>
    <td><input type="number" class="form-control expense-amount" value="${amount}" required></td>
    <td class="text-center">
      <input type="checkbox" class="form-check-input expense-fixed" ${isFixed ? "checked" : ""}>
    </td>
    <td class="text-center">
      <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('tr').remove(); updateChart();">X</button>
    </td>
  `;

  row.querySelectorAll("input").forEach(input =>
    input.addEventListener("input", updateChart)
  );

  table.appendChild(row);
  updateChart();
}

async function loadSavedBudget() {
  try {
    const res = await fetch("../php/get_budget.php");
    const result = await res.json();

    if (result.success) {
      const budgetInput = document.getElementById("monthlyBudget");
      if (budgetInput && result.budget) {
        budgetInput.value = result.budget;
      }

      const table = document.getElementById("expenseTableBody");
      table.innerHTML = "";

      if (Array.isArray(result.expenses)) {
        result.expenses.forEach(exp => {
          addExpenseRow(exp.label, exp.amount, exp.fixed);
        });
      }

      updateChart();
    } else {
      console.warn("No budget found.");
    }
  } catch (err) {
    console.error("Error loading saved budget:", err);
  }
}

function setupChartTypeSelector() {
  const selector = document.getElementById("chartType");
  if (!selector) return;

  selector.addEventListener("change", () => {
    currentChartType = selector.value;
    updateChart();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("addExpenseBtn");
  const budgetInput = document.getElementById("monthlyBudget");
  const saveBudgetBtn = document.getElementById("saveBudgetBtn");

  if (addBtn) addBtn.addEventListener("click", () => addExpenseRow());
  if (budgetInput) budgetInput.addEventListener("input", updateChart);

  setupChartTypeSelector();
  loadSavedBudget();

  if (saveBudgetBtn) {
      saveBudgetBtn.addEventListener("click", async () => {
      const budget = parseFloat(budgetInput.value || 0);
      const expenses = [];
      let fixedCount = 0;

      document.querySelectorAll(".expense-row").forEach(row => {
        const label = row.querySelector(".expense-label")?.value;
        const amount = parseFloat(row.querySelector(".expense-amount")?.value || 0);
        const fixed = row.querySelector(".expense-fixed")?.checked || false;
        if (label && amount > 0) {
          expenses.push({ label, amount, fixed });
          if (fixed) fixedCount++;
        }
      });

      try {
        const res = await fetch("../php/save_budget.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ budget, expenses, fixedCount })
        });

        const result = await res.json();
        if (result.success) {
          alert("Budget saved successfully!");
        } else {
          alert("Error: " + result.message);
        }
      } catch (err) {
        alert("An error occurred while saving.");
        console.error(err);
      }
    });
  }
});
