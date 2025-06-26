// ➤ Fonction corrigée : récupération des arrêts desservis par course
async function fetchStopsForVehicleJourney(vehicleJourneyRef) {
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

// ➤ Intégration dans le rendu principal : à insérer dans renderDepartures()
function injectStopsDynamically(mvjRef, liElement) {
  fetchStopsForVehicleJourney(mvjRef).then(stopList => {
    const html = stopList.length ? stopList.join(" – ") : "Liste non disponible";
    const div = liElement.querySelector(".defile-arrets");
    if (div) div.innerHTML = html;
  });
}