let namesData = [];
let weeksData = [];
let statusesData = [];
let historyData = {};

// Helpers
function createDropdown(options, selectedValue = "") {
  const select = document.createElement("select");
  options.forEach(opt => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    if (opt === selectedValue) {
      option.selected = true;
    }
    select.appendChild(option);
  });
  return select;
}

function applyStatusColor(select) {
  select.className = "status-select"; // reset base class
  const selectedStatus = select.value;
  select.classList.add(`status-${selectedStatus}`);
}

function renderTable() {
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";

  // sort by name
  namesData.sort((a, b) => a.name.localeCompare(b.name));

  namesData.forEach((emp, index) => {
    const row = document.createElement("tr");
    row.dataset.empId = emp.id;
    row.classList.add(index % 2 === 0 ? "even-row" : "odd-row");

    // Name cell
    const nameCell = document.createElement("td");
    nameCell.textContent = emp.name;
    row.appendChild(nameCell);

    // Week select cell
    const weekCell = document.createElement("td");
    const defaultWeek =
      Object.keys(historyData[emp.id] || {})[0] || weeksData[0];
    const weekSelect = createDropdown(weeksData, defaultWeek);
    weekSelect.classList.add("week-select");
    weekCell.appendChild(weekSelect);
    row.appendChild(weekCell);

    // function to render days for selected week
    const renderDays = week => {
      // remove old day cells
      while (row.children.length > 2) {
        row.removeChild(row.lastChild);
      }

      const daysData = historyData[emp.id]?.[week] || {};
      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(day => {
        const cell = document.createElement("td");
        const selectedStatus = daysData[day] || "Empty";
        const daySelect = createDropdown(statusesData, selectedStatus);
        daySelect.classList.add("status-select");
        daySelect.dataset.day = day;

        applyStatusColor(daySelect);
        daySelect.addEventListener("change", () =>
          applyStatusColor(daySelect)
        );

        cell.appendChild(daySelect);
        row.appendChild(cell);
      });
    };

    // initial render
    renderDays(defaultWeek);

    // when week changes
    weekSelect.addEventListener("change", () => {
      renderDays(weekSelect.value);
    });

    tableBody.appendChild(row);
  });
}

async function loadData() {
  // these still come from /input (Nginx proxies to backend)
  const namesRes = await fetch("/input/names.json");
  const weeksRes = await fetch("/input/selection.json");
  const statusRes = await fetch("/input/status.json");

  namesData = await namesRes.json();
  weeksData = await weeksRes.json();
  statusesData = await statusRes.json();

  // NOW: history comes from backend API instead of /output/history.json
  try {
    const historyRes = await fetch("/api/history");
    if (historyRes.ok) {
      historyData = await historyRes.json(); // backend should return {} or the full object
    } else {
      historyData = {};
    }
  } catch {
    historyData = {};
  }

  // Cleanup invalid entries
  for (const empId in historyData) {
    if (!namesData.some(n => String(n.id) === String(empId))) {
      delete historyData[empId];
      continue;
    }
    for (const week in historyData[empId]) {
      if (!weeksData.includes(week)) {
        delete historyData[empId][week];
      }
    }
  }

  renderTable();
}

document.addEventListener("DOMContentLoaded", () => {
  loadData();

  const saveBtn = document.getElementById("saveBtn");
  if (!saveBtn) {
    console.error("saveBtn not found in DOM");
    return;
  }

  saveBtn.addEventListener("click", async () => {
    const rows = document.querySelectorAll("#tableBody tr");

    rows.forEach(row => {
      const empId = row.dataset.empId;
      const week = row.querySelector(".week-select").value;
      const days = {};

      row.querySelectorAll(".status-select").forEach(sel => {
        const day = sel.dataset.day;
        if (!day) return; // skip week-select
        days[day] = sel.value;
      });

      if (!historyData[empId]) {
        historyData[empId] = {};
      }
      historyData[empId][week] = days;
    });

    const response = await fetch("/api/save-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(historyData),
    });

    if (response.ok) {
      alert("History saved successfully.");
    } else {
      alert("Error saving history.");
    }
  });
});

