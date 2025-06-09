const PROXY_URL = 'https://ratp-proxy.hippodrome-proxy42.workers.dev/';
const PANELS = [
  {
    id: "rer-content",
    line: "RER A",
    color: "#e2001a",
    icon: "img/picto-rer-a.svg",
    monitoringRef: "STIF:StopArea:SP:43135:",
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
    monitoringRef: "STIF:StopArea:SP:463641:",
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
    monitoringRef: "STIF:StopArea:SP:463644:",
    directions: [
      { name: "Vers Nogent", mots: ["Nogent", "Gare de Nogent"] },
      { name: "Vers Maisons-Alfort", mots: ["Maisons-Alfort"] }
    ]
  }
];

// --- Vélib config ---
const velibStations = [
  { code: "12163", container: "velib-vincennes", name: "Vincennes - République" },
  { code: "12128", container: "velib-breuil", name: "Château de Vincennes - Breuil" }
];

// --- Vélib affichage ---
async function fetchAndDisplayAllVelibStations() {
  const url = "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/velib-disponibilite-en-temps-reel/exports/json";
  let stations;
  try {
    const res = await fetch(url, { cache: "no-store" });
    stations = await res.json();
    if (!Array.isArray(stations)) throw new Error("Réponse Vélib' inattendue");
  } catch (e) {
    velibStations.forEach(sta => {
      const el = document.getElementById(sta.container);
      if (el) el.innerHTML = `<div class="status warning">Erreur Vélib : ${e.message}</div>`;
    });
    return;
  }
  for (const sta of velibStations) {
    const el = document.getElementById(sta.container);
    if (!el) continue;
    let station = stations.find(s => s.stationcode === sta.code);
    if (!station) {
      el.innerHTML = `<div class="status warning">Station Vélib’ non trouvée.</div>`;
      continue;
    }
    el.innerHTML = `
      <div class="velib-header">
        <span class="velib-nom">${station.name}</span>
      </div>
      <div class="velib-infos">
        <span class="velib-item">🚲 <b>${station.mechanical ?? "?"}</b> mécaniques</span>
        <span class="velib-item">⚡ <b>${station.ebike ?? "?"}</b> électriques</span>
        <span class="velib-item">🅿️ <b>${station.numdocksavailable ?? "?"}</b> bornes libres</span>
       </div>
    `;
  }
}
        // Liste des arrêts à venir (OnwardCalls)
        const allStops = onward.map(oc =>
          oc.StopPointName?.[0]?.value || oc.StopPointName?.value || "?"
        );
// Correction : OnwardCalls vide ? on montre au moins le stopName
if (allStops.length === 0 && stopName !== "?") allStops.unshift(stopName);

let stopClass = "panel-stop";
if (isCanceled) stopClass += " canceled";
else if (isDelayed) stopClass += " delayed";

return `
  <div class="${stopClass}">
    <span class="panel-arrival">
      ${mins !== null ? (mins > 0 ? `${mins} min` : "à l'instant") : "?"}
      ${isDelayed && !isCanceled ? '<span class="retard-badge">retard</span>' : ""}
      ${isCanceled ? '<span class="canceled-badge">supprimé</span>' : ""}
    </span>
    <span class="panel-stopname">
      ${stopName}
      ${voie ? `<span class="panel-voie">${voie}</span>` : ""}
    </span>
    <span class="panel-dest">→ ${dest}</span>
    ${allStops.length > 0 ? `
      <div class="panel-desserte">
        <div class="desserte-scroll">
          ${allStops.map(s => `<span class="gare">${s}</span>`).join('<span class="sep"> • </span>')}
        </div>
      </div>
    ` : ""}
  </div>
`;
              ${voie ? `<span class="panel-voie">${voie}</span>` : ""}
            </span>
            <span class="panel-dest">→ ${dest}</span>
            ${allStops.length > 0 ? `
              <div class="panel-desserte">
                <marquee behavior="scroll" direction="left" scrollamount="5">
                  ${allStops.map(s => `<span class="gare">${s}</span>`).join('<span class="sep"> • </span>')}
                </marquee>
              </div>
            ` : ""}
          </div>
        `;
      }).join("");
    return { name: dir.name, stops: stops };
  });

  const now = new Date();
  const heure = now.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });

  container.innerHTML = `
    <div class="panel-header">
      <img src="${panel.icon}" class="panel-icon" alt="${panel.line}"/>
      <span class="panel-line" style="background:${panel.color};">${panel.line}</span>
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

// Rafraîchissement et heure
function renderAllPanels() {
  for(const panel of PANELS) renderPanel(panel);
  fetchAndDisplayAllVelibStations();
}
setInterval(renderAllPanels, 60000);
renderAllPanels();

setInterval(() => {
  const now = new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });
  for(const panel of PANELS) {
    const el = document.getElementById(`${panel.id}-heure`);
    if(el) el.textContent = now;
  }
}, 1000);
