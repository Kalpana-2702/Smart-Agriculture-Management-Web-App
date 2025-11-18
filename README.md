# Smart Agriculture Management Web App

Modern single-page dashboard to orchestrate smart farming operations—fields, telemetry, irrigation, and crew workloads—built with vanilla HTML/CSS/JS for zero-build deployment.

## Features

- **KPI row** summarises cultivated area, crop health, irrigation readiness, and open work orders.
- **Field intelligence** with interactive filtering, NDVI proxy health, soil moisture, and irrigation urgency.
- **Sensor network** cards plus a Chart.js seven-day soil-moisture projection.
- **Irrigation planner** displaying AI-optimized timelines with manual overrides.
- **Ops board** to add/update tasks, track status, due dates, and assignments.
- **Decision support** surfaces auto-generated agronomic recommendations and risk alerts.
- **Observation log** for scouting notes, categorized and timestamped.
- Local persistence via `localStorage` so entries survive reloads.

## Getting Started

1. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari).
2. Interact with filters, add tasks/observations, simulate a data refresh, or auto-optimize irrigation.
3. Data lives locally; clear browser storage to reset to defaults.

## Tech Stack

- Static HTML layout with semantic sections
- Custom CSS (dark-mode friendly tokens, responsive grid)
- Vanilla JavaScript module managing state, rendering, and heuristics
- [Chart.js](https://www.chartjs.org/) CDN for moisture projections

## Future Enhancements

- Replace mock telemetry with a real API/data broker.
- Add authentication and role-based access.
- Integrate satellite imagery layers and NDVI time series.
- Sync tasks and observations with farm management ERP.

