const form = document.getElementById("expenseForm");
const tableBody = document.getElementById("expenseTableBody");
const chartCtx = document.getElementById("expenseChart").getContext("2d");
const categorySelect = document.getElementById("expenseCategory");

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let categoryBudgets = {};
let chartInstance = null;

// Fetch budget categories and limits from server
async function fetchBudgetLimits() {
  try {
    const res = await fetch("../php/get_budget.php");
    const data = await res.json();

    if (data.success && Array.isArray(data.expenses)) {
      data.expenses.forEach(item => {
        const category = item.label;
        const limit = Number(item.amount);
        categoryBudgets[category] = limit;

        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
      });
    }
  } catch (err) {
    console.error("Failed to load budget limits:", err);
  }
}

// Display expenses in table
function renderTable() {
  tableBody.innerHTML = "";
  expenses.forEach(exp => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${exp.date}</td><td>${exp.amount}</td><td>${exp.category}</td>`;
    tableBody.appendChild(row);
  });
}

// Draw the budget usage chart
function renderChart() {
  const spentPerCategory = {};

  expenses.forEach(e => {
    spentPerCategory[e.category] = (spentPerCategory[e.category] || 0) + Number(e.amount);
  });

  const labels = Object.keys(categoryBudgets);
  const spent = labels.map(cat => spentPerCategory[cat] || 0);
  const remaining = labels.map(cat => Math.max(categoryBudgets[cat] - (spentPerCategory[cat] || 0), 0));

  const chartData = {
    labels,
    datasets: [
      {
        label: "Spent",
        data: spent,
        backgroundColor: "#dc3545",
        grouped: false
      },
      {
        label: "Remaining",
        data: remaining,
        backgroundColor: "#198754",
        grouped: false
      }
    ]
  };


  if (chartInstance instanceof Chart) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(chartCtx, {
    type: "bar",
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Budget Usage by Category",
          font: { size: 18 }
        },
        legend: {
          labels: {
            font: { size: 14 }
          }
        },
        datalabels: {
          color: "#444",
          font: {
            size: 12,
            weight: "bold"
          },
          anchor: "end",     // label position relative to bar
          align: "start",    // "start" puts it inside the top of the bar
          offset: -2,
          formatter: (value) => value > 0 ? `€${value}` : "", // show only non-zero values
          clamp: true
        }
      },
      scales: {
        x: {
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 20,
            font: { size: 12 }
          },
          stacked: true
        },
        y: {
          beginAtZero: true,
          stacked: true,
          ticks: {
            stepSize: 50,
            font: { size: 12 }
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });

}

// When user adds an expense
form.addEventListener("submit", e => {
  e.preventDefault();
  const newExpense = {
    date: document.getElementById("expenseDate").value,
    amount: parseFloat(document.getElementById("expenseAmount").value),
    category: document.getElementById("expenseCategory").value
  };

  expenses.push(newExpense);
  localStorage.setItem("expenses", JSON.stringify(expenses));

  renderTable();
  renderChart();
  form.reset();
});

// Load everything
fetchBudgetLimits().then(() => {
  renderTable();
  renderChart();
});
