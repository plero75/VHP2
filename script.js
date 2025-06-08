const PROXY_URL = 'https://ratp-proxy.hippodrome-proxy42.workers.dev/';
const PANELS = [
  {
    id: "rer-content",
    line: "RER A",
    color: "#e2001a",
    icon: "img/picto-rer-a.svg",
    monitoringRef: "STIF:StopArea:SP:43135:", // Vincennes
    directions: [
      { name: "Vers Paris", mots: ["Paris", "Châtelet", "La Défense", "Saint-Germain", "Cergy", "Poissy"] },
      { name: "Vers Boissy/Sucy", mots: ["Boissy", "Sucy", "Chessy", "Marne-la-Vallée"] }
    ]
  },
  {
    id: "bus77-content",
    line: "77",
    color: "#009f4d",
    icon: "img/picto-bus-77.svg",
    monitoringRef: "STIF:StopArea:SP:463641:", // Vincennes
    directions: [
      { name: "Vers Joinville", mots: ["Joinville", "Gare de Joinville"] },
      { name: "Vers Créteil", mots: ["Créteil", "Pointe du Lac"] }
    ]
  },
  {
    id: "bus201-content",
    line: "201",
    color: "#009f4d",
    icon: "img/picto-bus-201.svg",
    monitoringRef: "STIF:StopArea:SP:463644:", // Vincennes
    directions: [
      { name: "Vers Nogent", mots: ["Nogent", "Gare de Nogent"] },
      { name: "Vers Maisons-Alfort", mots: ["Maisons-Alfort"] }
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

  // Regroupement par sens (on compare la destination, insensible à la casse)
  let stopsByDir = panel.directions.map(dir => {
    // Pour chaque sens, sélectionne les passages dont la destination matche
    const stops = visits
      .filter(v => {
        const dest =
          v.MonitoredVehicleJourney?.DestinationName?.[0]?.value ||
          v.MonitoredVehicleJourney?.MonitoredCall?.DestinationDisplay?.[0]?.value ||
          "";
        return dir.mots.some(mot => dest.toLowerCase().includes(mot.toLowerCase()));
      })
      .slice(0, 3)
      .map(v => {
        const call = v.MonitoredVehicleJourney?.MonitoredCall || {};
        const stopName =
          call.StopPointName?.[0]?.value ||
          call.StopPointName?.value ||
          "?";
        const dest =
          v.MonitoredVehicleJourney?.DestinationName?.[0]?.value ||
          call.DestinationDisplay?.[0]?.value ||
          "?";
        const aimed = call.ExpectedArrivalTime || call.AimedArrivalTime;
        const dt = aimed ? new Date(aimed) : null;
        const mins = dt ? Math.round((dt - new Date()) / 60000) : null;
        return `
          <div class="panel-stop">
            <span class="panel-arrival">${mins !== null ? (mins > 0 ? `${mins} min` : "à l'instant") : "?"}</span>
            <span class="panel-stopname">${stopName}</span>
            <span class="panel-dest">→ ${dest}</span>
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
    <div class="panel-header" style="background: #222; color: #fff; font-size: 1.18em; font-weight: bold; padding: 12px 24px; border-radius: 18px 18px 0 0; display:flex;align-items:center;justify-content:space-between;">
      <img src="${panel.icon}" class="panel-icon" alt="${panel.line}" style="height:38px; margin-right:12px;"/>
      <span class="panel-line" style="background:${panel.color}; color:#fff; border-radius:8px; padding:2px 12px; margin:0 10px 0 0; font-weight:bold; font-size:1.1em;">${panel.line}</span>
      ${panel.line}
      <span class="panel-time" id="${panel.id}-heure">${heure}</span>
    </div>
    <div class="panel-stops" style="padding:0 24px 10px 24px;">
      ${stopsByDir.map(dir =>
        `<div>
          <div class="sens-title" style="font-size:1.1em;font-weight:bold;color:#ffd900;margin-top:18px;margin-bottom:8px;">${dir.name}</div>
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
