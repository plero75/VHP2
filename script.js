const PROXY_URL = 'https://ratp-proxy.hippodrome-proxy42.workers.dev/';
const PANEL_CONFIG = [
  {
    id: "rer-a-vincennes-ouest",
    title: "RER A → Paris",
    line: "RER A",
    color: "#e2001a",
    icon: "img/picto-rer-a.svg",
    monitoringRef: "STIF:StopArea:SP:43135:", // Vincennes vers Paris
    stops: 3
  },
  {
    id: "rer-a-vincennes-est",
    title: "RER A → Boissy/Sucy",
    line: "RER A",
    color: "#e2001a",
    icon: "img/picto-rer-a.svg",
    monitoringRef: "STIF:StopArea:SP:43135:", // Vincennes vers Boissy
    stops: 3
  },
  {
    id: "bus-77-ouest",
    title: "Bus 77 → Joinville",
    line: "77",
    color: "#009f4d",
    icon: "img/picto-bus-77.svg",
    monitoringRef: "STIF:StopArea:SP:463641:", // Vincennes vers Joinville
    stops: 3
  },
  {
    id: "bus-77-est",
    title: "Bus 77 → Créteil",
    line: "77",
    color: "#009f4d",
    icon: "img/picto-bus-77.svg",
    monitoringRef: "STIF:StopArea:SP:463641:", // Vincennes vers Créteil
    stops: 3
  },
  {
    id: "bus-201-nord",
    title: "Bus 201 → Nogent",
    line: "201",
    color: "#009f4d",
    icon: "img/picto-bus-201.svg",
    monitoringRef: "STIF:StopArea:SP:463644:", // Vincennes vers Nogent
    stops: 3
  },
  {
    id: "bus-201-sud",
    title: "Bus 201 → Maisons-Alfort",
    line: "201",
    color: "#009f4d",
    icon: "img/picto-bus-201.svg",
    monitoringRef: "STIF:StopArea:SP:463644:", // Vincennes vers Maisons-Alfort
    stops: 3
  }
];

async function renderPanel(panel) {
  const container = document.getElementById(panel.id);
  if (!container) return;

  const apiBase = "https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring";
  const apiUrl = `${apiBase}?MonitoringRef=${encodeURIComponent(panel.monitoringRef)}`;
  const url = `${PROXY_URL}?url=${encodeURIComponent(apiUrl)}`;
  let visits = [];
  try {
    const res = await fetch(url, {cache: "no-store"});
    const data = await res.json();
    visits = (data.Siri?.ServiceDelivery?.StopMonitoringDelivery?.[0]?.MonitoredStopVisit) || [];
  } catch (e) {
    container.innerHTML = `<div class="status warning">⛔ Arrêts indisponibles (${e.message})</div>`;
    return;
  }

  const stopsHtml = visits.slice(0, panel.stops).map(v => {
    const aimed = v.MonitoredVehicleJourney?.MonitoredCall?.AimedArrivalTime;
    const dt = aimed ? new Date(aimed) : null;
    const mins = dt ? Math.round((dt - new Date()) / 60000) : null;
    const dest = v.MonitoredVehicleJourney?.DestinationName?.value || "?";
    return `
      <div class="generic-panel-stop">
        <span class="generic-panel-arrival">${mins !== null ? (mins > 0 ? `${mins} min` : "à l'instant") : "?"}</span>
        <span class="generic-panel-stopname">${dest}</span>
        <span class="generic-panel-modes"><img src="${panel.icon}" alt="${panel.line}"/></span>
      </div>
    `;
  }).join("");

  const now = new Date();
  const heure = now.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });

  container.innerHTML = `
    <div class="generic-panel-header">
      <img src="${panel.icon}" class="generic-panel-icon" alt="${panel.line}"/>
      <span class="generic-panel-line" style="background:${panel.color}; color:#fff;">${panel.line}</span>
      ${panel.title}
      <span class="generic-panel-time" id="${panel.id}-heure">${heure}</span>
    </div>
    <div class="generic-panel-stops">${stopsHtml}</div>
  `;
}

function renderAllPanels() {
  for(const panel of PANEL_CONFIG) renderPanel(panel);
}
setInterval(renderAllPanels, 60000);
renderAllPanels();

setInterval(() => {
  const now = new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });
  for(const panel of PANEL_CONFIG) {
    const el = document.getElementById(`${panel.id}-heure`);
    if(el) el.textContent = now;
  }
}, 1000);
