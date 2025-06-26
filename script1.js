/* === CONFIGURATION === */
const STOP_POINTS = {
  rer: {
    name: "RER A Joinville-le-Pont",
    realtimeUrl: "https://ratp-proxy.hippodrome-proxy42.workers.dev/?url=https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring?MonitoringRef=STIF:StopPoint:Q:43135:",
    scheduleUrl: "https://ratp-proxy.hippodrome-proxy42.workers.dev/?url=https://prim.iledefrance-mobilites.fr/marketplace/v2/navitia/stop_points/stop_point:IDFM:monomodalStopPlace:43135/route_schedules?line=line:IDFM:C01742&from_datetime=",
    icon: "img/picto-rer-a.svg"
  },
  bus77: {
    name: "BUS 77 Hippodrome de Vincennes",
    realtimeUrl: "https://ratp-proxy.hippodrome-proxy42.workers.dev/?url=https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring?MonitoringRef=STIF:StopPoint:Q:463641:",
    scheduleUrl: "https://ratp-proxy.hippodrome-proxy42.workers.dev/?url=https://prim.iledefrance-mobilites.fr/marketplace/v2/navitia/stop_points/stop_point:IDFM:463640/route_schedules?line=line:IDFM:C02251&from_datetime=",
    icon: "img/picto-bus.svg"
  },
  bus201: {
    name: "BUS 201 Ecole du Breuil",
    realtimeUrl: "https://ratp-proxy.hippodrome-proxy42.workers.dev/?url=https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring?MonitoringRef=STIF:StopPoint:Q:463644:",
    scheduleUrl: "https://ratp-proxy.hippodrome-proxy42.workers.dev/?url=https://prim.iledefrance-mobilites.fr/marketplace/v2/navitia/stop_points/stop_point:IDFM:463646/route_schedules?line=line:IDFM:C01219&from_datetime=",
    icon: "img/picto-bus.svg"
  }
};
async function fetchTrafficRoad() {
  const url = "https://data.cerema.fr/api/records/1.0/search/?dataset=etat-trafic-rn&rows=50&refine.zone_nom=Île-de-France";
  try {
    const data = await fetchJSON(url);
    const routes = data.records
      .filter(r => ["A86", "BP"].includes(r.fields.route_nom))
      .map(r => ({
        troncon: r.fields.libelle_troncon,
        etat: r.fields.etat_trafic,
        couleur: r.fields.couleur
      }));

    let html = `<div class='title-line'><img src='img/picto-car.svg' class='icon-inline'>Trafic routier</div>`;
    html += routes.map(r => `<div><span style="color:${r.couleur}">●</span> ${r.troncon} : ${r.etat}</div>`).join("");
    document.getElementById("trafic-road").innerHTML = html;
  } catch (e) {
    document.getElementById("trafic-road").innerHTML = "<b>Trafic routier indisponible</b>";
  }
}

const VELIB_IDS = {
  vincennes: "1074333296",
  breuil: "508042092"
};
 // === Requête générique (via proxy, sans apikey explicite)
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

/* === TEMPS & FORMAT === */
function updateDateTime() {
  const now = new Date();
  document.getElementById("current-date").textContent = now.toLocaleDateString("fr-FR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById("current-time").textContent = now.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });
  document.getElementById("last-update").textContent = "Dernière mise à jour : " + now.toLocaleString("fr-FR");
}

function formatTime(iso, withSeconds = false) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "-";
  const options = withSeconds ? { hour: "2-digit", minute: "2-digit", second: "2-digit" } : { hour: "2-digit", minute: "2-digit" };
  return date.toLocaleTimeString("fr-FR", options);
}

function getDestinationName(d) {
  if (!d) return "Destination inconnue";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d[0]?.value || "Destination inconnue";
  if (typeof d === "object") return d.value || "Destination inconnue";
  return "Destination inconnue";
}

function minutesUntil(dateTimeStr) {
  const now = new Date();
  const target = new Date(dateTimeStr);
  const diff = (target - now) / 60000;
  if (isNaN(diff)) return "";
  if (diff < 1.5) return `<span class='imminent'>(passage imminent)</span>`;
  return `<span class='temps'> (${Math.round(diff)} min)</span>`;
}

/* === TRANSPORTS === */
function renderDepartures(id, title, data, icon, first, last) {
  const el = document.getElementById(id);
  let html = `<div class='title-line'><img src='${icon}' class='icon-inline'>${title}</div>`;
  if (!data || data.length === 0) {
    html += `<ul><li>Aucun passage à venir</li></ul>`;
  } else {
    const grouped = {};
    data.forEach(d => {
      const dir = getDestinationName(d.MonitoredVehicleJourney.DirectionName);
      if (!grouped[dir]) grouped[dir] = [];
      grouped[dir].push(d);
    });
    for (const dir in grouped) {
      html += `<h4 class='direction-title'>Direction ${dir}</h4><ul>`;
      grouped[dir].slice(0, 4).forEach(d => {
        const call = d.MonitoredVehicleJourney.MonitoredCall;
        const expected = call.ExpectedDepartureTime;
        const aimed = call.AimedDepartureTime;
        const isLast = d.MonitoredVehicleJourney.FirstOrLastJourney?.value === "LAST_SERVICE_OF_DAY";
        const mvjRef = d.MonitoredVehicleJourney.DatedVehicleJourneyRef;
        const liId = `dep-${mvjRef.replace(/[^a-z0-9]/gi, "")}`;
        html += `<li id="${liId}">▶ ${formatTime(expected)}${minutesUntil(expected)} ${
          expected !== aimed ? `<span class='delay'>(+${Math.round((new Date(expected) - new Date(aimed)) / 60000)} min)</span>` : ""
        } ${isLast ? "<span class='last-train'>(dernier train)</span>" : ""}<div class='defile-arrets'>Chargement...</div></li>`;
      });
      html += "</ul>";
    }
  }
  html += `<div class='schedule-extremes'>Premier départ : ${first || "-"}<br>Dernier départ : ${last || "-"}</div>`;
  el.innerHTML = html;

  // Injection dynamique des arrêts
  data.forEach(d => {
    const mvjRef = d.MonitoredVehicleJourney.DatedVehicleJourneyRef;
    const liId = `dep-${mvjRef.replace(/[^a-z0-9]/gi, "")}`;
    const li = document.getElementById(liId);
    if (li) injectStopsDynamically(mvjRef, li);
  });
}

async function fetchTransport(stopKey, elementId) {
  try {
    const data = await fetchJSON(STOP_POINTS[stopKey].realtimeUrl);
    const visits = data?.Siri?.ServiceDelivery?.StopMonitoringDelivery?.[0]?.MonitoredStopVisit || [];
    renderDepartures(elementId, STOP_POINTS[stopKey].name, visits, STOP_POINTS[stopKey].icon, localStorage.getItem(`${stopKey}-first`), localStorage.getItem(`${stopKey}-last`));
  } catch (e) {
    document.getElementById(elementId).innerHTML = `<div class='title-line'><img src='${STOP_POINTS[stopKey].icon}' class='icon-inline'>${STOP_POINTS[stopKey].name}</div><div class='error'>Données indisponibles</div>`;
  }
}

async function fetchSchedulesOncePerDay() {
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem("schedule-day") === today) return;

  for (let key in STOP_POINTS) {
    try {
      const url = STOP_POINTS[key].scheduleUrl + today.replace(/-/g, "") + "T000000";
      const data = await fetchJSON(url);
      const rows = data.route_schedules?.[0]?.table?.rows || [];
      const times = [];
      rows.forEach(row => {
        row.stop_date_times?.forEach(sdt => {
          if (sdt.departure_time) times.push(sdt.departure_time);
        });
      });
      times.sort();
      if (times.length) {
        const fmt = t => `${t.slice(0, 2)}:${t.slice(2, 4)}`;
        localStorage.setItem(`${key}-first`, fmt(times[0]));
        localStorage.setItem(`${key}-last`, fmt(times[times.length - 1]));
      }
    } catch (e) {
      console.error(`Erreur fetchSchedulesOncePerDay ${key}:`, e);
    }
  }
  localStorage.setItem("schedule-day", today);
}

/* === Vélib' === */
async function fetchVelib(stationId, elementId) {
  try {
    const url = "https://prim.iledefrance-mobilites.fr/marketplace/velib/station_status.json";
    const data = await fetchJSON(url);
    const station = data.data.stations.find(s => s.station_id == stationId);
    if (!station) throw new Error("Station Vélib non trouvée");
    const mechanical = station.num_bikes_available_types.find(b => b.mechanical !== undefined)?.mechanical || 0;
    const ebike = station.num_bikes_available_types.find(b => b.ebike !== undefined)?.ebike || 0;
    const free = station.num_docks_available || 0;
    document.getElementById(elementId).innerHTML = `
      <div class='title-line'><img src='img/picto-velib.svg' class='icon-inline'>Vélib'</div>
      🚲 Mécaniques : ${mechanical}<br>
      ⚡ Électriques : ${ebike}<br>
      🅿️ Places libres : ${free}
    `;
  } catch (e) {
    document.getElementById(elementId).innerHTML = "<b>Erreur Vélib</b>";
  }
}

/* === Météo === */
async function fetchWeather() {
  try {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=48.82&longitude=2.44&current_weather=true&hourly=temperature_2m,precipitation";
    const data = await fetchJSON(url);
    const w = data.current_weather;
    document.getElementById("weather-content").innerHTML = `
      <div class="title-line"><img src="img/picto-meteo.svg" class="icon-inline">Météo</div>
      🌡️ Température : <b>${w.temperature}°C</b><br>
      ☀️ ${w.weathercode === 0 ? "Soleil" : w.weathercode === 2 ? "Nuages" : "Variable"}<br>
      💨 Vent : ${w.windspeed} km/h`;
  } catch (e) {
    document.getElementById("weather-content").innerHTML = "<b>Météo indisponible</b>";
  }
}

/* === Infos Trafic === */
async function fetchInfoTrafic() {
  document.getElementById("info-trafic").innerHTML = `
    <div class="title-line"><img src="img/picto-info.svg" class="icon-inline">Info trafic</div>
    <span style="font-size:1.09em;">Travaux d'été RER A<br>Bus 77 : arrêt Hippodrome en service<br>Bus 201 : trafic normal</span>
  `;
}

/* === Arrêts par course (VehicleJourney) === */
async function fetchStopsForVehicleJourney(vehicleJourneyRef) {
  const apiKey = "VOTRE_CLE_API";
  const proxy = "https://ratp-proxy.hippodrome-proxy42.workers.dev/?url=";
  const url = `${proxy}https://prim.iledefrance-mobilites.fr/marketplace/vehicle-journeys/${vehicleJourneyRef}/stop_points`;

  try {
    const res = await fetch(url, { headers: { apikey: apiKey, Accept: "application/json" } });
    if (!res.ok) throw new Error("Échec requête vehicle-journey stop_points");
    const data = await res.json();
    return data?.stop_points?.map(p => p.name) || [];
  } catch (e) {
    console.warn("Fallback GTFS utilisé", e);
    return await fallbackGtfsStops(vehicleJourneyRef);
  }
}

async function fallbackGtfsStops(vehicleJourneyRef) {
  const url = `/data/gtfs-trips/${vehicleJourneyRef}.json`;
  try {
    const data = await fetchJSON(url);
    return data.stops || [];
  } catch (e) {
    console.error("GTFS local non disponible", e);
    return [];
  }
}

function injectStopsDynamically(mvjRef, liElement) {
  fetchStopsForVehicleJourney(mvjRef).then(stopList => {
    const html = stopList.length ? stopList.join(" – ") : "Liste non disponible";
    const div = liElement.querySelector(".defile-arrets");
    if (div) div.innerHTML = html;
  });
}

/* === Refresh général === */
function refreshAll() {
  updateDateTime();
  fetchWeather();
  fetchInfoTrafic();
  fetchSchedulesOncePerDay();
  fetchTransport("rer", "rer-content");
  fetchTransport("bus77", "bus77-content");
  fetchTransport("bus201", "bus201-content");
  fetchVelib(VELIB_IDS.vincennes, "velib-vincennes");
  fetchVelib(VELIB_IDS.breuil, "velib-breuil");
}

setInterval(refreshAll, 60000);
refreshAll();async function fetchStopsForVehicleJourney(vehicleJourneyRef) {
  const apiKey = "VOTRE_CLE_API";
  const proxy = "https://ratp-proxy.hippodrome-proxy42.workers.dev/?url=";
  const url = `${proxy}https://prim.iledefrance-mobilites.fr/marketplace/vehicle-journeys/${vehicleJourneyRef}/stop_points`;

  try {
    const res = await fetch(url, {
      headers: { apikey: apiKey, Accept: "application/json" },
    });
    if (!res.ok) throw new Error("Échec requête vehicle-journey stop_points");
    const data = await res.json();
    const stops = data?.stop_points?.map(p => p.name) || [];
    return stops;
  } catch (e) {
    console.warn("Fallback GTFS utilisé", e);
    return await fallbackGtfsStops(vehicleJourneyRef);
  }
}

// ➤ Exemple de fallback (GTFS préchargé côté serveur ou fichier JSON)
async function fallbackGtfsStops(vehicleJourneyRef) {
  const url = `/data/gtfs-trips/${vehicleJourneyRef}.json`;
  try {
    const data = await fetchJSON(url);
    return data.stops || [];
  } catch (e) {
    console.error("GTFS local non disponible", e);
    return [];
  }
} 
