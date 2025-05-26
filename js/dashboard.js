fetch("../php/get_user_info.php")
  .then(response => response.json())
  .then(data => {
    const headerButtons = document.getElementById("header-buttons");
    if (data.loggedIn) {
      headerButtons.innerHTML = `
        <div class="dropdown">
          <a href="#" class="d-block link-dark text-decoration-none dropdown-toggle" id="profileDropdown" data-bs-toggle="dropdown" aria-expanded="false">
            <img src="${data.profilePicture}" alt="Profile" class="rounded-circle" width="48" height="48">
          </a>
          <ul class="dropdown-menu dropdown-menu-end text-small" aria-labelledby="profileDropdown">
            <li><strong class="dropdown-item">${data.userName}</strong></li>
            <li><a class="dropdown-item" href="../php/profile.php">My Profile</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="../php/logout.php">Logout</a></li>
          </ul>
        </div>`;
    } else {
      headerButtons.innerHTML = `
        <a href="login.html" class="btn btn-outline-primary btn-sm me-2">Login</a>
        <a href="signup.html" class="btn btn-primary btn-sm me-3">Sign Up</a>`;
    }
  });

const universitySelect = document.getElementById("universitySelect");
const housingSelect = document.getElementById("housingSelect");
const transportSelect = document.getElementById("transportSelect");
const ctx = document.getElementById("costChart").getContext("2d");

let chart;

const options = {
  "ISEN Brest": {
    Apartment: ["Foot", "Bike", "Car", "Bus", "Scooter"],
    "Family Home": ["Foot", "Bike", "Car", "Bus", "Scooter"],
    "Flat sharing": ["Foot", "Bike", "Car", "Bus", "Scooter"], 
  },
  "BINUS Jakarta": {
    "BINUS Hall of Residence": ["Grab", "Bike", "Car", "Public Transport", "Foot"],
    Apartment: ["Grab", "Bike", "Car", "Public Transport", "Foot"],
    "Family Home": ["Grab", "Bike", "Car", "Public Transport", "Foot"]
  }
};

const dataSets = {
  "ISEN Brest": {
    Apartment: {
      Bike: [240, 120, 0, 20, 10, 500, 10],
      Car: [240, 120, 0, 20, 90, 500, 10],
      Bus: [240, 120, 0, 20, 60, 500, 10],
      Foot: [240, 120, 0, 20, 0, 500, 10],
      Scooter: [240, 120, 0, 20, 20, 500, 10]
    },
    "Family Home": {
      Bike: [100, 160, 0, 20, 10, 0, 10],
      Car: [100, 160, 0, 20, 140, 0, 10],
      Bus: [100, 160, 0, 20, 60, 0, 10],
      Foot: [100, 160, 0, 20, 0, 0, 10],
      Scooter: [100, 160, 0, 20, 50, 0, 10]
    },
    "Flat sharing": {
        Bike: [240, 120, 0, 20, 10, 350, 10],
        Car: [240, 120, 0, 20, 90, 350, 10],
        Bus: [240, 120, 0, 20, 60, 350, 10],
        Foot: [240, 120, 0, 20, 0, 350, 10],
        Scooter: [240, 120, 0, 20, 20, 350, 10]
    },
  },
  "BINUS Jakarta": {
    "BINUS Hall of Residence": {
      Grab: [2000000, 1000000, 230000, 400000, 500000, 2500000, 50000],
      Car: [2000000, 1000000, 230000, 400000, 1000000, 2500000, 50000],
      "Public Transport": [2000000, 1000000, 230000, 400000, 400000, 2500000, 50000],
      Bike: [2000000, 1000000, 230000, 400000, 50000, 2500000, 50000],
      Foot: [2000000, 1000000, 230000, 400000, 0, 2500000, 50000],
      Shuttle: [2000000, 1000000, 230000, 400000, 0, 2500000, 50000]
    },
    Apartment: {
      Grab: [2000000, 1000000, 230000, 400000, 800000, 2000000, 50000],
      Car: [2000000, 1000000, 230000, 400000, 1000000, 2000000, 50000],
      "Public Transport": [2000000, 1000000, 230000, 400000, 400000, 2000000, 50000],
      Bike: [2000000, 1000000, 230000, 400000, 100000, 2000000, 50000],
      Foot: [2000000, 1000000, 230000, 400000, 0, 2000000, 50000]
    },
    "Family Home": {
      Grab: [1000000, 1000000, 230000, 400000, 800000, 0, 50000],
      Car: [1000000, 1000000, 230000, 400000, 1000000, 0, 50000],
      "Public Transport": [1000000, 1000000, 230000, 400000, 400000, 0, 50000],
      Bike: [1000000, 1000000, 230000, 400000, 100000, 0, 50000],
      Foot: [1000000, 1000000, 230000, 400000, 0, 0, 50000]
    }
  }
};

function populateSelect(selectElement, values) {
  selectElement.innerHTML = `<option value="">-- Select --</option>`;
  values.forEach(val => {
    const option = document.createElement("option");
    option.value = val;
    option.textContent = val;
    selectElement.appendChild(option);
  });
  selectElement.disabled = false;
}

universitySelect.addEventListener("change", () => {
  const university = universitySelect.value;
  if (university && options[university]) {
    populateSelect(housingSelect, Object.keys(options[university]));
    transportSelect.innerHTML = `<option value="">-- Select --</option>`;
    transportSelect.disabled = true;
  } else {
    housingSelect.disabled = true;
    transportSelect.disabled = true;
  }
});

housingSelect.addEventListener("change", () => {
  const university = universitySelect.value;
  const housing = housingSelect.value;
  if (university && housing && options[university]?.[housing]) {
    populateSelect(transportSelect, options[university][housing]);
  } else {
    transportSelect.disabled = true;
  }
});

transportSelect.addEventListener("change", () => {
  const u = universitySelect.value;
  const h = housingSelect.value;
  const t = transportSelect.value;
  if (!u || !h || !t) return;

  const values = dataSets[u]?.[h]?.[t];
  if (!values) return;

  const labels = [
    "Food",
    "Leisure",
    "Health Insurance",
    "Books",
    "Transport",
    "Rent",
    "Internet package"
  ];

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          "#3b82f6", "#f97316", "#6b7280", "#facc15",
          "#10b981", "#8b5cf6", "#ec4899"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Estimated Monthly Student Costs"
        },
        datalabels: {
        formatter: (value, context) => {
            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            const percentage = (value / total * 100);
            return percentage === 0 ? null : `${percentage.toFixed(1)}%`;
            },
              
          color: '#fff',
          font: {
            weight: 'bold'
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });  
});
