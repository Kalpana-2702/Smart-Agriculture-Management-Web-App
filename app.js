const STORAGE_KEY = "farm-ops-dashboard";

const defaultState = {
  lastSync: new Date().toISOString(),
  fields: [
    {
      id: "north-1",
      name: "North Ridge",
      crop: "Wheat",
      variety: "Synergy Gold",
      area: 12,
      soilType: "Loam",
      health: 82,
      soilMoisture: 31,
      evapotranspiration: 4.1,
      stage: "Tillering",
      irrigationNeed: "Medium",
    },
    {
      id: "delta-4",
      name: "Delta Terrace",
      crop: "Tomato",
      variety: "Roma VF",
      area: 6.5,
      soilType: "Clay",
      health: 68,
      soilMoisture: 24,
      evapotranspiration: 5.2,
      stage: "Fruit set",
      irrigationNeed: "High",
    },
    {
      id: "orchard-west",
      name: "Orchard West",
      crop: "Avocado",
      variety: "Hass",
      area: 9.8,
      soilType: "Sandy loam",
      health: 76,
      soilMoisture: 36,
      evapotranspiration: 3.6,
      stage: "Vegetative",
      irrigationNeed: "Low",
    },
    {
      id: "pilot-plot",
      name: "Pilot Microplot",
      crop: "Chickpea",
      variety: "Kabuli",
      area: 2.1,
      soilType: "Silt loam",
      health: 91,
      soilMoisture: 42,
      evapotranspiration: 2.9,
      stage: "Pre-flower",
      irrigationNeed: "Low",
    },
  ],
  sensors: [
    {
      id: "S-108",
      fieldId: "north-1",
      metric: "Soil moisture",
      value: 31,
      unit: "%",
      health: "good",
      battery: 78,
      lastSyncMins: 18,
    },
    {
      id: "S-221",
      fieldId: "delta-4",
      metric: "Nitrate",
      value: 18,
      unit: "ppm",
      health: "warn",
      battery: 56,
      lastSyncMins: 42,
    },
    {
      id: "S-334",
      fieldId: "orchard-west",
      metric: "Canopy temp",
      value: 29,
      unit: "°C",
      health: "good",
      battery: 64,
      lastSyncMins: 12,
    },
    {
      id: "S-445",
      fieldId: "pilot-plot",
      metric: "Soil EC",
      value: 1.9,
      unit: "dS/m",
      health: "critical",
      battery: 22,
      lastSyncMins: 66,
    },
  ],
  irrigationPlan: [
    {
      id: crypto.randomUUID(),
      fieldId: "delta-4",
      window: "04:00–05:30",
      volume: 16,
      priority: "High deficit",
    },
    {
      id: crypto.randomUUID(),
      fieldId: "north-1",
      window: "05:30–06:15",
      volume: 9,
      priority: "Kc aligned",
    },
    {
      id: crypto.randomUUID(),
      fieldId: "orchard-west",
      window: "22:00–23:10",
      volume: 12,
      priority: "Night cycle",
    },
  ],
  tasks: [
    {
      id: crypto.randomUUID(),
      title: "Top dress nitrogen",
      assignee: "Priya",
      fieldId: "north-1",
      status: "in_progress",
      due: addDays(1),
      notes: "Follow 40 kg/ha recommendation",
    },
    {
      id: crypto.randomUUID(),
      title: "Scout tomato leaf curl",
      assignee: "Marco",
      fieldId: "delta-4",
      status: "open",
      due: addDays(0),
      notes: "Use drone feed if wind > 10 kmh",
    },
    {
      id: crypto.randomUUID(),
      title: "Irrigation audit",
      assignee: "Zara",
      fieldId: "orchard-west",
      status: "done",
      due: addDays(-1),
      notes: "Log emitter uniformity",
    },
  ],
  observations: [
    {
      id: crypto.randomUUID(),
      fieldId: "delta-4",
      category: "pest",
      note: "Whitefly pressure rising near south row",
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      fieldId: "north-1",
      category: "soil",
      note: "Infiltration good after deficit irrigation",
      createdAt: new Date().toISOString(),
    },
  ],
};

function addDays(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

const state = loadState();
let moistureChart;

document.addEventListener("DOMContentLoaded", () => {
  hydrateSelects();
  bindEvents();
  renderDashboard();
});

function loadState() {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return structuredClone(defaultState);
    const parsed = JSON.parse(cached);
    return { ...structuredClone(defaultState), ...parsed };
  } catch (err) {
    console.warn("Failed to load state", err);
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function hydrateSelects() {
  const cropFilter = document.getElementById("crop-filter");
  cropFilter.innerHTML = `<option value="all">All crops</option>` +
    state.fields.map((f) => `<option value="${f.crop}">${f.crop}</option>`).join("");

  const fieldSelects = document.querySelectorAll('select[name="field"]');
  const options = state.fields.map((f) => `<option value="${f.id}">${f.name}</option>`).join("");
  fieldSelects.forEach((select) => {
    select.innerHTML = `<option value="" disabled selected>Select field</option>${options}`;
  });
}

function bindEvents() {
  document.getElementById("refresh-dashboard").addEventListener("click", simulateRefresh);
  document.getElementById("crop-filter").addEventListener("change", () => {
    renderFields();
    renderFieldMap();
  });
  document.getElementById("health-filter").addEventListener("input", (event) => {
    event.target.title = `${event.target.value}% min`;
    renderFields();
    renderFieldMap();
  });
  document.getElementById("task-filter").addEventListener("change", renderTasks);
  document.getElementById("toggle-sensor-view").addEventListener("click", toggleSensorDensity);
  document.getElementById("optimize-water").addEventListener("click", optimizeIrrigationPlan);
  document.getElementById("task-form").addEventListener("submit", handleTaskSubmit);
  document.getElementById("irrigation-form").addEventListener("submit", handleIrrigationSubmit);
  document.getElementById("observation-form").addEventListener("submit", handleObservationSubmit);
}

function renderDashboard() {
  document.getElementById("last-sync").textContent = new Date(state.lastSync).toLocaleString();
  document.getElementById("weather-readout").textContent = generateWeatherHeadline();
  renderKPIs();
  renderFieldMap();
  renderFields();
  renderSensors();
  renderIrrigation();
  renderTasks();
  renderRecommendations();
  renderObservations();
}

function renderKPIs() {
  const container = document.getElementById("kpi-container");
  const totalArea = state.fields.reduce((sum, f) => sum + f.area, 0);
  const avgHealth = Math.round(state.fields.reduce((sum, f) => sum + f.health, 0) / state.fields.length);
  const irrigationCompletion = Math.round((state.irrigationPlan.length / (state.fields.length * 1.5)) * 100);
  const openTasks = state.tasks.filter((t) => t.status !== "done").length;

  const kpis = [
    { label: "Cultivated hectares", value: `${totalArea.toFixed(1)} ha`, meta: "Across 4 fields" },
    { label: "Crop health index", value: `${avgHealth}%`, meta: "Weighted NDVI" },
    { label: "Irrigation readiness", value: `${irrigationCompletion}%`, meta: "Scheduled vs demand" },
    { label: "Active work orders", value: openTasks, meta: "Crew allocation" },
  ];

  container.innerHTML = kpis
    .map(
      (kpi) => `<article class="kpi">
        <small>${kpi.label}</small>
        <strong>${kpi.value}</strong>
        <span>${kpi.meta}</span>
      </article>`
    )
    .join("");
}

function getFilters() {
  return {
    crop: document.getElementById("crop-filter").value,
    minHealth: Number(document.getElementById("health-filter").value),
  };
}

function filteredFields() {
  const { crop, minHealth } = getFilters();
  return state.fields.filter((field) => {
    const cropOk = crop === "all" || field.crop === crop;
    const healthOk = field.health >= minHealth;
    return cropOk && healthOk;
  });
}

function renderFieldMap() {
  const container = document.getElementById("field-map");
  container.innerHTML = filteredFields()
    .map(
      (field) => `<div class="field-tile" data-field="${field.id}">
        <h3>${field.name}</h3>
        <span>${field.crop} · ${field.area} ha</span>
        <div class="progress"><div class="fill" style="width:${field.health}%"></div></div>
        <small>${field.irrigationNeed} irrigation · Stage ${field.stage}</small>
      </div>`
    )
    .join("");
}

function renderFields() {
  const table = document.getElementById("fields-table");
  const head = `<thead>
      <tr>
        <th>Field</th>
        <th>Crop</th>
        <th>Health</th>
        <th>Soil moisture</th>
        <th>ET₀</th>
        <th>Irrigation</th>
      </tr>
    </thead>`;
  const rows = filteredFields()
    .map(
      (field) => `<tr>
        <td>${field.name}</td>
        <td>${field.crop}</td>
        <td>${field.health}%</td>
        <td>${field.soilMoisture}%</td>
        <td>${field.evapotranspiration} mm</td>
        <td><span class="status-pill ${statusClass(field)}">${field.irrigationNeed}</span></td>
      </tr>`
    )
    .join("");
  table.innerHTML = head + `<tbody>${rows}</tbody>`;
}

function statusClass(field) {
  if (field.irrigationNeed === "High") return "critical";
  if (field.irrigationNeed === "Medium") return "warn";
  return "good";
}

function renderSensors() {
  const grid = document.getElementById("sensor-cards");
  grid.innerHTML = state.sensors
    .map(
      (sensor) => `<article class="sensor-card" data-density="${sensor.health}">
        <h4>${sensor.metric}</h4>
        <strong>${sensor.value} ${sensor.unit}</strong>
        <small>${sensor.id} · ${lookupField(sensor.fieldId).name}</small>
        <small>Battery ${sensor.battery}% · synced ${sensor.lastSyncMins} min ago</small>
      </article>`
    )
    .join("");
  renderMoistureChart();
}

function renderMoistureChart() {
  const ctx = document.getElementById("moisture-chart");
  const dataPoints = state.fields.map((field) => field.soilMoisture);
  const projection = generateProjection(dataPoints);

  const config = {
    type: "line",
    data: {
      labels: projection.labels,
      datasets: [
        {
          label: "Forecast moisture %",
          data: projection.values,
          borderColor: "#4caf50",
          backgroundColor: "rgba(76,175,80,0.2)",
          tension: 0.35,
          fill: true,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { suggestedMin: 10, suggestedMax: 50, ticks: { callback: (v) => `${v}%` } },
      },
    },
  };

  if (moistureChart) {
    moistureChart.data = config.data;
    moistureChart.update();
  } else {
    moistureChart = new Chart(ctx, config);
  }
}

function generateProjection(values) {
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const labels = Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`);
  const projected = labels.map((_, idx) => {
    const seasonalDrift = Math.sin(idx / 2) * 3;
    return Math.max(10, Math.round(avg + seasonalDrift - idx * 1.5));
  });
  return { labels, values: projected };
}

function renderIrrigation() {
  const list = document.getElementById("irrigation-plan");
  list.innerHTML = state.irrigationPlan
    .map((slot) => {
      const field = lookupField(slot.fieldId);
      const tone = slot.priority.includes("High") ? "critical" : slot.priority.includes("Night") ? "good" : "warn";
      return `<li>
        <strong>${slot.window}</strong>
        <div>${field.name} · ${slot.volume} L/ha</div>
        <span class="status-pill ${tone}">${slot.priority}</span>
      </li>`;
    })
    .join("");
}

function renderTasks() {
  const filter = document.getElementById("task-filter").value;
  const board = document.getElementById("task-board");
  const tasks = state.tasks.filter((task) => (filter === "all" ? true : task.status === filter));
  board.innerHTML = tasks
    .map(
      (task) => `<article class="task-card" data-status="${task.status}">
        <h4>${task.title}</h4>
        <small>${lookupField(task.fieldId).name}</small>
        <p>${task.notes || "—"}</p>
        <div class="task-meta">
          <span>Due ${task.due}</span>
          <span>${task.assignee}</span>
        </div>
        <div class="task-actions">
          ${renderTaskActions(task)}
        </div>
      </article>`
    )
    .join("");
  board.querySelectorAll("button[data-task]").forEach((btn) => btn.addEventListener("click", mutateTask));
}

function renderTaskActions(task) {
  if (task.status === "done") return `<button data-task="${task.id}" data-status="open">Reopen</button>`;
  if (task.status === "open") {
    return `<button data-task="${task.id}" data-status="in_progress">Start</button>
            <button data-task="${task.id}" data-status="done">Complete</button>`;
  }
  if (task.status === "in_progress") {
    return `<button data-task="${task.id}" data-status="done">Complete</button>`;
  }
  return "";
}

function mutateTask(event) {
  const { task: taskId, status } = event.currentTarget.dataset;
  const task = state.tasks.find((t) => t.id === taskId);
  if (task) {
    task.status = status;
    saveState();
    renderTasks();
    renderKPIs();
  }
}

function renderRecommendations() {
  const list = document.getElementById("recommendations");
  const recs = buildRecommendations();
  list.innerHTML = recs
    .map(
      (rec) => `<li>
        <strong>${rec.title}</strong>
        <p>${rec.detail}</p>
        <small>${rec.impact}</small>
      </li>`
    )
    .join("");
}

function buildRecommendations() {
  const recs = [];
  const dryField = state.fields.find((field) => field.soilMoisture < 25);
  if (dryField) {
    recs.push({
      title: `Irrigate ${dryField.name}`,
      detail: `${dryField.crop} block is below optimal moisture (${dryField.soilMoisture}%). Boost irrigation by 15%.`,
      impact: "Prevents stress during flowering window.",
    });
  }
  const lateTask = state.tasks.find((task) => new Date(task.due) < new Date() && task.status !== "done");
  if (lateTask) {
    recs.push({
      title: `Escalate ${lateTask.title}`,
      detail: `Task is overdue. Assign backup crew or reschedule to avoid crop impact.`,
      impact: `Owner: ${lateTask.assignee}`,
    });
  }
  const criticalSensor = state.sensors.find((sensor) => sensor.health === "critical" || sensor.battery < 25);
  if (criticalSensor) {
    recs.push({
      title: `Service sensor ${criticalSensor.id}`,
      detail: `Battery at ${criticalSensor.battery}% and health ${criticalSensor.health}. Schedule maintenance.`,
      impact: `Field ${lookupField(criticalSensor.fieldId).name}`,
    });
  }
  if (recs.length === 0) {
    recs.push({
      title: "All systems steady",
      detail: "No critical actions detected. Continue monitoring telemetry.",
      impact: "Review again at next sync window.",
    });
  }
  return recs;
}

function renderObservations() {
  const list = document.getElementById("observation-log");
  list.innerHTML = state.observations
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6)
    .map(
      (entry) => `<li>
        <strong>${lookupField(entry.fieldId).name} · ${entry.category}</strong>
        <p>${entry.note}</p>
        <small>${new Date(entry.createdAt).toLocaleString()}</small>
      </li>`
    )
    .join("");
}

function handleTaskSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const newTask = {
    id: crypto.randomUUID(),
    title: form.title.value,
    assignee: form.assignee.value,
    fieldId: form.field.value,
    due: form.due.value,
    status: "open",
    notes: form.notes.value,
  };
  state.tasks.unshift(newTask);
  saveState();
  renderTasks();
  renderRecommendations();
  renderKPIs();
  form.reset();
}

function handleIrrigationSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const plan = {
    id: crypto.randomUUID(),
    fieldId: form.field.value,
    window: form.window.value,
    volume: Number(form.volume.value),
    priority: "Manual",
  };
  state.irrigationPlan.unshift(plan);
  saveState();
  renderIrrigation();
  renderRecommendations();
  form.reset();
}

function handleObservationSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const entry = {
    id: crypto.randomUUID(),
    fieldId: form.field.value,
    category: form.category.value,
    note: form.note.value,
    createdAt: new Date().toISOString(),
  };
  state.observations.unshift(entry);
  saveState();
  renderObservations();
  renderRecommendations();
  form.reset();
}

function simulateRefresh() {
  state.lastSync = new Date().toISOString();
  state.fields.forEach((field) => {
    const drift = randomBetween(-2, 2);
    field.soilMoisture = Math.max(10, Math.min(60, field.soilMoisture + drift));
    field.health = Math.max(40, Math.min(98, field.health + randomBetween(-1, 1)));
  });
  state.sensors.forEach((sensor) => {
    sensor.value = Math.round(sensor.value + randomBetween(-1.5, 1.5));
    sensor.lastSyncMins = 0;
    sensor.battery = Math.max(5, sensor.battery - randomBetween(0, 2));
  });
  saveState();
  renderDashboard();
}

function toggleSensorDensity() {
  document.getElementById("sensor-cards").classList.toggle("dense");
}

function optimizeIrrigationPlan() {
  const highNeedFields = state.fields.filter((field) => field.irrigationNeed !== "Low");
  state.irrigationPlan = highNeedFields.map((field) => ({
    id: crypto.randomUUID(),
    fieldId: field.id,
    window: `${formatHour(3 + Math.floor(Math.random() * 4))}:00–${formatHour(4 + Math.floor(Math.random() * 4))}:30`,
    volume: Math.round((35 - field.soilMoisture) * 0.8),
    priority: "AI optimized",
  }));
  saveState();
  renderIrrigation();
  renderRecommendations();
}

function lookupField(id) {
  return state.fields.find((field) => field.id === id) ?? state.fields[0];
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function generateWeatherHeadline() {
  const temp = Math.round(randomBetween(18, 28));
  const wind = Math.round(randomBetween(6, 16));
  const chance = Math.round(randomBetween(10, 60));
  return `${temp}°C · ${wind} km/h wind · ${chance}% precip`;
}

function formatHour(hour) {
  return hour.toString().padStart(2, "0");
}

