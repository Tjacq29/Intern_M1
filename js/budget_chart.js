let chartInstance = null;

document.addEventListener("DOMContentLoaded", async () => {
  const canvas = document.getElementById("budgetChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  try {
    const res = await fetch("../php/get_budget.php");
    const result = await res.json();

    if (!result.success) throw new Error(result.message || "Could not fetch budget data.");

    const { budget, customExpenses } = result;

    console.log("Budget:", budget);
    console.log("Custom Expenses:", customExpenses);

    const labels = [];
    const values = [];
    const colors = [];

    function addItem(label, value) {
      if (value && value > 0) {
        labels.push(label);
        values.push(value);
        colors.push(getRandomColor());
      }
    }

    addItem("Housing", budget.housingCost);
    addItem("Transport", budget.transportCost);
    addItem("Activity", budget.activityCost);
    addItem("Savings", budget.savings);

    customExpenses.forEach(item => {
      if (item.label && item.cost > 0) {
        addItem(item.label, parseInt(item.cost));
      }
    });

    // Destroy previous chart if needed
    if (chartInstance) chartInstance.destroy();

    // Build chart
    chartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Your Monthly Expense Breakdown"
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                const percent = ((ctx.raw / total) * 100).toFixed(1);
                return `${ctx.label}: ${ctx.raw} (${percent}%)`;
              }
            }
          }
        }
      }
    });

  } catch (err) {
    console.error("Error loading chart:", err);
    alert("Error loading chart data");
  }
});

// Simple color generator
function getRandomColor() {
  const colors = [
    "#3b82f6", "#f97316", "#16a34a", "#facc15",
    "#8b5cf6", "#ef4444", "#10b981", "#a855f7",
    "#f472b6", "#fb923c", "#4ade80", "#fcd34d"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
