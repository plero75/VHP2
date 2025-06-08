const PROXY_URL = 'https://ratp-proxy.hippodrome-proxy42.workers.dev/';
const PANELS = [
  {
    id: "panel-rer-a",
    line: "RER A",
    color: "#e2001a",
    icon: "img/picto-rer-a.svg",
    monitoringRef: "STIF:StopArea:SP:43135:", // Vincennes
    directions: [
      { name: "Vers Paris", dests: ["PARIS", "Châtelet", "La Défense", "Saint-Germain", "Cergy", "Poissy"] },
      { name: "Vers Boissy/Sucy", dests: ["Boissy", "Sucy", "Marne-la-Vallée", "Chessy"] }
    ]
  },
  {
    id: "panel-bus-77",
    line: "77",
    color: "#009f4d",
    icon: "img/picto-bus-77.svg",
    monitoringRef: "STIF:StopArea:SP:463641:", // Vincennes
    directions: [
      { name: "Vers Joinville", dests: ["Joinville", "Gare de Joinville"] },
      { name: "Vers Créteil", dests: ["Créteil", "Pointe du Lac"] }
    ]
  },
  {
    id: "panel-bus-201",
    line: "201",
    color: "#009f4d",
    icon: "img/picto-bus-201.svg",
    monitoringRef: "STIF:StopArea:SP:463644:", // Vincennes
    directions: [
      { name: "Vers Nogent", dests: ["Nogent", "Gare de Nogent"] },
      { name: "Vers Maisons-Alfort", dests: ["Maisons-Alfort"] }
    ]
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
    container.innerHTML = `<div class="status warning">⛔ Données indisponibles (${e.message})</div>`;
    return;
  }

  // Regroupement par sens (on compare la destination)
  let stopsByDir = panel.directions.map(dir => {
    // Pour chaque sens, sélectionne les passages dont la destination matche
    const stops = visits
      .filter(v => {
        const dest = (v.MonitoredVehicleJourney?.DestinationName?.value || "").toLowerCase();
        return dir.dests.some(d => dest.includes(d.toLowerCase()));
      })
      .slice(0, 3)
      .map(v => {
        const aimed = v.MonitoredVehicleJourney?.MonitoredCall?.AimedArrivalTime;
        const dt = aimed ? new Date(aimed) : null;
        const mins = dt ? Math.round((dt - new Date()) / 60000) : null;
        const dest = v.MonitoredVehicleJourney?.DestinationName?.value || "?";
        return `
          <div class="panel-stop">
            <span class="panel-arrival">${mins !== null ? (mins > 0 ? `${mins} min` : "à l'instant") : "?"}</span>
            <span class="panel-stopname">${dest}</span>
            <span class="panel-modes"><img src="${panel.icon}" alt="${panel.line}"/></span>
          </div>
        `;
      }).join("");
    return { name: dir.name, stops: stops };
  });

  // L’heure du panneau
  const now = new Date();
  const heure = now.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });

  // Affichage du panneau
  container.innerHTML = `
    <div class="panel-header">
      <img src="${panel.icon}" class="panel-icon" alt="${panel.line}"/>
      <span class="panel-line" style="background:${panel.color}; color:#fff;">${panel.line}</span>
      ${panel.line}
      <span class="panel-time" id="${panel.id}-heure">${heure}</span>
    </div>
    <div class="panel-stops">
      ${stopsByDir.map(dir =>
        `<div>
          <div class="sens-title">${dir.name}</div>
          ${dir.stops || `<div class="status warning">Aucun passage imminent</div>`}
        </div>`).join("")}
    </div>
  `;
}

// Rafraîchit tous les panneaux toutes les 60s
function renderAllPanels() {
  for(const panel of PANELS) renderPanel(panel);
}
setInterval(renderAllPanels, 60000);
renderAllPanels();

// Met à jour l'heure sur chaque panneau chaque seconde
setInterval(() => {
  const now = new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });
  for(const panel of PANELS) {
    const el = document.getElementById(`${panel.id}-heure`);
    if(el) el.textContent = now;
  }
}, 1000);
