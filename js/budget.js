// === Global Flags ===
let chartInstance = null;
let currentChartType = "pie"; // default
let selectedCurrency = "€";
let inputAsPercentage = false; // not used anymore

// === Utilities ===
function getRandomColor() {
  const colors = [
    "#3b82f6", "#f97316", "#16a34a", "#facc15", "#8b5cf6", "#ef4444",
    "#10b981", "#a855f7", "#f472b6", "#fb923c", "#4ade80", "#fcd34d",
    "#6366f1", "#dc2626", "#22d3ee", "#e879f9", "#84cc16", "#f43f5e",
    "#0ea5e9", "#14b8a6", "#9ca3af", "#7c3aed", "#c084fc", "#d97706"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function convertPercentToValue(percent, total) {
  return Math.round((percent / 100) * total);
}

function convertValueToPercent(value, total) {
  return total > 0 ? ((value / total) * 100).toFixed(1) : 0;
}

// === Chart Update ===
function updateChart() {
  const budgetInput = document.getElementById("monthlyBudget");
  if (!budgetInput) return;

  const budget = parseFloat(budgetInput.value || 0);
  const labels = [];
  const values = [];
  const colors = [];
  let totalExpenses = 0;

  document.querySelectorAll(".expense-row").forEach(row => {
    const label = row.querySelector(".expense-label")?.value.trim();
    const amountInput = row.querySelector(".expense-amount");
    const percentInput = row.querySelector(".expense-percent");
    const currencySpan = row.querySelector(".currency-symbol");

    let value = parseFloat(amountInput?.value || 0);
    if (budget > 0 && percentInput !== document.activeElement) {
      const percent = convertValueToPercent(value, budget);
      percentInput.value = percent;
    }

    if (label && value > 0) {
      labels.push(label);
      values.push(value);
      totalExpenses += value;
      colors.push(getRandomColor());
    }

    if (currencySpan) currencySpan.textContent = selectedCurrency;
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
              const value = context.parsed.y ?? context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percent = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${value} ${selectedCurrency} (${percent}%)`;
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

// === Expense Row ===
function addExpenseRow(label = '', amount = '', isFixed = false) {
  const table = document.getElementById("expenseTableBody");
  if (!table) return;

  const row = document.createElement("tr");
  row.classList.add("expense-row");

  row.innerHTML = `
    <td>
      <input type="text" class="form-control expense-label" value="${label}" required>
    </td>
    <td>
      <div class="input-group">
        <input type="number" class="form-control expense-amount" value="${amount}" required>
        <span class="input-group-text currency-symbol">${selectedCurrency}</span>
      </div>
    </td>
    <td>
      <div class="input-group">
        <input type="number" class="form-control expense-percent" placeholder="%" min="0" max="100">
        <span class="input-group-text">%</span>
      </div>
    </td>
    <td class="text-center align-middle">
      <input type="checkbox" class="form-check-input expense-fixed" ${isFixed ? "checked" : ""}>
    </td>
    <td class="text-center align-middle">
      <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('tr').remove(); updateChart();">X</button>
    </td>
  `;

  // Update chart on any input
  row.querySelectorAll("input").forEach(input =>
    input.addEventListener("input", updateChart)
  );

  // Handle percentage -> amount conversion
  const percentInput = row.querySelector(".expense-percent");
  const amountInput = row.querySelector(".expense-amount");

  percentInput.addEventListener("input", () => {
    const budget = parseFloat(document.getElementById("monthlyBudget")?.value || 0);
    const percent = parseFloat(percentInput.value || 0);
    if (!isNaN(percent) && budget > 0) {
      amountInput.value = Math.round((percent / 100) * budget);
      updateChart();
    }
  });

  table.appendChild(row);
  updateChart();
}

// === Load Saved Budget ===
async function loadSavedBudget() {
  const monthInput = document.getElementById("budgetMonth");
  const selectedMonthValue = monthInput?.value;

  // Defensive: ensure value is in "YYYY-MM" format
  if (!selectedMonthValue || !/^\d{4}-\d{2}$/.test(selectedMonthValue)) {
    return;
  }

  const [year, monthStr] = selectedMonthValue.split("-");
  const month = parseInt(monthStr, 10);
  const yearInt = parseInt(year, 10);

  if (!yearInt || !month || month < 1 || month > 12) {
    console.warn("Invalid month or year.");
    return;
  }

  try {
    const res = await fetch(`../php/get_budget.php?month=${month}&year=${yearInt}`);
    const result = await res.json();

    if (result.success) {
      const budgetInput = document.getElementById("monthlyBudget");
      if (budgetInput) {
        budgetInput.value = result.budget || 0;
      }

      const table = document.getElementById("expenseTableBody");
      if (table) table.innerHTML = "";

      if (Array.isArray(result.expenses)) {
        result.expenses.forEach(exp => {
          // Some backends use is_fixed, some use fixed
          addExpenseRow(exp.label, exp.amount, exp.is_fixed || exp.fixed);
        });
      }

      updateChart();
    } else {
      console.warn("No budget found for selected month.");
      const budgetInput = document.getElementById("monthlyBudget");
      if (budgetInput) budgetInput.value = "";
      const table = document.getElementById("expenseTableBody");
      if (table) table.innerHTML = "";
      updateChart();
    }
  } catch (err) {
    console.error("Error loading saved budget:", err);
  }
}

// === Setup Selectors ===
function setupChartTypeSelector() {
  const selector = document.getElementById("chartType");
  if (!selector) return;
  selector.addEventListener("change", () => {
    currentChartType = selector.value;
    updateChart();
  });
}

function setupCurrencySelector() {
  const selector = document.getElementById("currencySelect");
  if (!selector) return;
  // Set the selector to the saved value on load
  const savedCurrency = localStorage.getItem('selectedCurrency');
  if (savedCurrency) selector.value = savedCurrency;
  selector.addEventListener("change", (e) => {
    selectedCurrency = e.target.value;
    localStorage.setItem('selectedCurrency', selectedCurrency); // <-- Save to localStorage
    updateChart();
  });
}

// === Init ===
document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("addExpenseBtn");
  const budgetInput = document.getElementById("monthlyBudget");
  const saveBudgetBtn = document.getElementById("saveBudgetBtn");
  const monthInput = document.getElementById("budgetMonth");

  if (addBtn) addBtn.addEventListener("click", () => addExpenseRow());
  if (budgetInput) budgetInput.addEventListener("input", updateChart);

  setupChartTypeSelector();
  setupCurrencySelector();

  // Si aucun mois sélectionné, mettre le mois courant
  if (monthInput && !monthInput.value) {
    const today = new Date();
    monthInput.value = today.toISOString().slice(0, 7); // ex: "2025-06"
  }

  // Charger les données lorsque le mois change
  // ...dans le DOMContentLoaded...
  if (monthInput) {
    // Charger la valeur sauvegardée
    const savedMonth = localStorage.getItem("selectedBudgetMonth");
    if (savedMonth) monthInput.value = savedMonth;

    monthInput.addEventListener("change", () => {
      localStorage.setItem("selectedBudgetMonth", monthInput.value);
      loadSavedBudget();
    });
  }

  // Charger automatiquement si un mois est déjà sélectionné
  loadSavedBudget();

  // Sauvegarde du budget
  if (saveBudgetBtn) {
    saveBudgetBtn.addEventListener("click", async () => {
      const selectedMonthValue = monthInput?.value;
      // Defensive: ensure value is in "YYYY-MM" format
      if (!selectedMonthValue || !/^\d{4}-\d{2}$/.test(selectedMonthValue)) {
        alert("Please select a valid month.");
        return;
      }

      const [year, monthStr] = selectedMonthValue.split("-");
      const month = parseInt(monthStr, 10);
      const yearInt = parseInt(year, 10);

      const budget = parseFloat(budgetInput.value || 0);
      const expenses = [];
      let fixedCount = 0;

      document.querySelectorAll(".expense-row").forEach(row => {
        const label = row.querySelector(".expense-label")?.value;
        let amount = parseFloat(row.querySelector(".expense-amount")?.value || 0);
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
          body: JSON.stringify({
            month: month,
            year: yearInt,
            budget,
            expenses,
            fixedCount
          })
        });

        const result = await res.json();
        if (result.success) {
          alert("Budget saved successfully for " + selectedMonthValue + "!");
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
