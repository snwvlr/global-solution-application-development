let mapa = null;
let marcadores = null;
let linhaNoMapa = null;

function prepararMapa() {
  if (mapa === null) {
    mapa = L.map("mapa", { scrollWheelZoom: false }).setView([-23.55, -46.63], 12);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(mapa);

    marcadores = L.layerGroup().addTo(mapa);
  }
  mapa.invalidateSize();
}

function mostrarNoMapa(linha, listaOnibus) {
  prepararMapa();
  marcadores.clearLayers();

  const posicoes = [];

  listaOnibus.forEach((onibus) => {
    let cor = "#e59400";
    if (onibus.a) {
      cor = "#1f7a3a";
    }

    L.circleMarker([onibus.py, onibus.px], {
      radius: 9,
      color: "#ffffff",
      weight: 2,
      fillColor: cor,
      fillOpacity: 1,
    })
      .bindTooltip("Ônibus " + onibus.p)
      .addTo(marcadores);

    posicoes.push([onibus.py, onibus.px]);
  });

  // a gente só centraliza o mapa quando troca de linha; se fizesse isso a cada atualização,
  // o mapa ficaria pulando enquanto a pessoa está mexendo nele
  if (linhaNoMapa !== linha.cl && posicoes.length > 0) {
    mapa.fitBounds(posicoes, { padding: [30, 30], maxZoom: 15 });
    linhaNoMapa = linha.cl;
  }
}

function focarOnibus(lat, lng) {
  mapa.setView([lat, lng], 16);
}
