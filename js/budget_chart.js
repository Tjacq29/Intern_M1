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

    const labels = [];
    const values = [];
    const colors = [
      "#3b82f6", "#f97316", "#16a34a", "#facc15", "#8b5cf6", "#ef4444", "#10b981", "#a855f7", "#f472b6", "#fb923c"
    ];

    if (budget.housingCost > 0) {
      labels.push("Housing");
      values.push(budget.housingCost);
    }

    if (budget.transportCost > 0) {
      labels.push("Transport");
      values.push(budget.transportCost);
    }

    if (budget.activityCost > 0) {
      labels.push("Activity");
      values.push(budget.activityCost);
    }

    if (budget.savings > 0) {
      labels.push("Savings");
      values.push(budget.savings);
    }

    customExpenses.forEach((item) => {
      if (item.label && item.cost > 0) {
        labels.push(item.label);
        values.push(parseInt(item.cost));
      }
    });

    // ✅ Destroy previous chart if it exists
    if (chartInstance !== null) {
      chartInstance.destroy();
    }

    // ✅ Create new chart
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
