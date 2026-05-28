/**
 * detalheObra.js — Página de detalhes da obra (obra.html)
 */

import { buscarObras, buscarExecucaoObra, buscarGeometriaObra, buscarItensObra, buscarDocumentosObra } from "./api.js";

function formatMoeda(v) {
  if (v == null || v === "") return "—";
  return parseFloat(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatData(d) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return isNaN(dt) ? d : dt.toLocaleDateString("pt-BR");
}

function formatMesAno(d) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return isNaN(dt) ? d : dt.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function situacaoClass(nome) {
  if (!nome) return "badge-default";
  const l = nome.toLowerCase();
  if (l.includes("conclu"))         return "badge-concluida";
  if (l.includes("andamento"))      return "badge-execucao";
  if (l.includes("parali"))         return "badge-paralisada";
  if (l.includes("cancel") || l.includes("inacab")) return "badge-cancelada";
  return "badge-default";
}

function renderDetalhes(obra) {
  document.title = `${obra.descricaoGeometria || obra.informacoesAdicionais || "Obra #" + obra.obraId} — TCEPE`;

  const titulo = obra.descricaoGeometria || obra.informacoesAdicionais || obra.enderecoFallback || `Obra #${obra.obraId}`;
  document.getElementById("obra-titulo").textContent = titulo;

  // Subtítulo: InformacoesAdicionais se diferente do título
  const subtituloEl = document.getElementById("obra-subtitulo");
  if (obra.informacoesAdicionais && obra.informacoesAdicionais !== titulo) {
    subtituloEl.textContent = obra.informacoesAdicionais;
    subtituloEl.style.display = "block";
  }

  document.getElementById("obra-situacao").innerHTML =
    `<span class="badge ${situacaoClass(obra.situacaoObraNome)}">${obra.situacaoObraNome || "—"}</span>`;
  document.getElementById("obra-inicio").textContent      = formatData(obra.dataInicioObra);
  document.getElementById("obra-conclusao").textContent   = formatData(obra.dataConclusaoObra);
  document.getElementById("obra-medido").textContent      = formatMoeda(obra.totalMedido);
  document.getElementById("obra-pago").textContent        = formatMoeda(obra.totalPago);
  document.getElementById("obra-id").textContent          = obra.obraId;
  document.getElementById("obra-instrumento").textContent = obra.instrumentoJuridicoId || "—";

  // Endereço
  const endEl = document.getElementById("obra-endereco");
  if (endEl) endEl.textContent = obra.endereco || "—";

  // Secretaria
  const secEl = document.getElementById("obra-secretaria");
  const secFonteEl = document.getElementById("obra-secretaria-fonte");
  if (secEl) {
    if (obra.secretariaNome?.trim()) {
      secEl.textContent = obra.secretariaNome.trim();
      secEl.classList.remove("texto-muted");
      if (secFonteEl) {
        const fontes = {
          instrumento: "Fonte: instrumento jurídico (TCEPE)",
          catalogo_tce: "Fonte: catálogo de subunidades (TCEPE)",
          processo_contratacao: "Fonte: processo de contratação (TCEPE)",
          processo_catalogo: "Fonte: processo de contratação + catálogo (TCEPE)",
        };
        secFonteEl.textContent = fontes[obra.secretariaFonte] || "";
      }
    } else if (!obra.instrumentoJuridicoId) {
      secEl.textContent = "Não informada — obra sem instrumento jurídico no TCEPE";
      secEl.classList.add("texto-muted");
      if (secFonteEl) secFonteEl.textContent = "";
    } else {
      secEl.textContent = "Não informada — subunidade não cadastrada no TCEPE";
      secEl.classList.add("texto-muted");
      if (secFonteEl) secFonteEl.textContent = "";
    }
  }

  // Empresa contratada
  const empEl = document.getElementById("obra-empresa");
  const empDocEl = document.getElementById("obra-empresa-doc");
  if (empEl) {
    if (obra.empresaContratadaNome) {
      empEl.textContent = obra.empresaContratadaNome;
      if (empDocEl) {
        const partes = [];
        if (obra.empresaContratadaDocumentoFormatado) {
          partes.push(obra.empresaContratadaDocumentoFormatado);
        }
        if (obra.empresaContratadaTipo) {
          partes.push(obra.empresaContratadaTipo);
        }
        const fontesEmp = {
          obras_dados_contratacao: "Fonte: ObrasDadosContratacao (TCEPE)",
          instrumento_participantes: "Fonte: participantes do instrumento jurídico (TCEPE)",
        };
        if (obra.empresaContratadaFonte && fontesEmp[obra.empresaContratadaFonte]) {
          partes.push(fontesEmp[obra.empresaContratadaFonte]);
        }
        empDocEl.textContent = partes.join(" · ");
      }
      if (obra.empresasContratadas?.length > 1 && empDocEl) {
        const extras = obra.empresasContratadas.slice(1)
          .map(e => `${e.nome}${e.documentoFormatado ? ` (${e.documentoFormatado})` : ""}`)
          .join("; ");
        empDocEl.textContent += (empDocEl.textContent ? " — " : "") + `Outros: ${extras}`;
      }
    } else {
      empEl.textContent = "Não informada no TCEPE";
      empEl.classList.add("texto-muted");
      if (empDocEl) empDocEl.textContent = "";
    }
  }

  // Barra de progresso
  const m    = parseFloat(obra.totalMedido) || 0;
  const p    = parseFloat(obra.totalPago)   || 0;
  const base = Math.max(m, p, 1);
  const pctP = Math.min((p / base) * 100, 100).toFixed(1);
  const pctM = Math.min((m / base) * 100, 100).toFixed(1);

  document.getElementById("obra-progresso").innerHTML = `
    <div class="detalhe-progresso">
      <div class="prog-label-row">
        <span>Valor Medido<strong>${formatMoeda(m)}</strong></span>
        <span>Valor Pago<strong>${formatMoeda(p)}</strong></span>
      </div>
      <div class="prog-track">
        <div class="prog-fill prog-medido" style="width:${pctM}%"></div>
        <div class="prog-fill prog-pago"   style="width:${pctP}%"></div>
      </div>
      <div class="prog-pct-row">
        <span class="prog-pct-tag medido-tag">${pctM}% medido</span>
        <span class="prog-pct-tag pago-tag">${pctP}% pago</span>
      </div>
    </div>`;
}

function renderExecucao(execucoes) {
  const tbody   = document.getElementById("execucao-tbody");
  const empty   = document.getElementById("sem-execucao");
  const loading = document.getElementById("loading-execucao");
  if (loading) loading.style.display = "none";
  tbody.innerHTML = "";

  if (!execucoes || execucoes.length === 0) {
    empty.style.display = "block";
    return;
  }

  const sorted = [...execucoes].sort(
    (a, b) => new Date(b.mesAnoExecucao) - new Date(a.mesAnoExecucao)
  );

  let totalM = 0, totalP = 0;
  sorted.forEach(e => {
    totalM += parseFloat(e.valorMedido) || 0;
    totalP += parseFloat(e.valorPago)   || 0;
  });

  tbody.innerHTML = sorted.map(e => `
    <tr>
      <td>${formatMesAno(e.mesAnoExecucao)}</td>
      <td class="td-valor">${formatMoeda(e.valorMedido)}</td>
      <td class="td-valor">${formatMoeda(e.valorPago)}</td>
    </tr>`).join("");

  const tfoot = document.getElementById("execucao-tfoot");
  if (tfoot) tfoot.innerHTML = `
    <tr class="tfoot-total">
      <td><strong>Total</strong></td>
      <td class="td-valor"><strong>${formatMoeda(totalM)}</strong></td>
      <td class="td-valor"><strong>${formatMoeda(totalP)}</strong></td>
    </tr>`;
}

function coordValida(v) {
  const n = parseFloat(v);
  return !isNaN(n) && n !== 0;
}

// A API TCEPE usa dois formatos de coordenada:
// - Decimal normal: lat=-8.053070, lon=-34.582222
// - Escalonado:     lat=-811798   (×100000), lon=-349619 (×10000)
// Heurística: |lat|>90 → escalonado; |lon|>180 → escalonado
function normalizarCoordenada(lat, lon) {
  let la = parseFloat(lat);
  let lo = parseFloat(lon);
  if (Math.abs(la) > 90)  la = la / 100000;
  if (Math.abs(lo) > 180) lo = lo / 10000;
  // Valida range final
  if (la === 0 || lo === 0) return null;
  if (Math.abs(la) > 90 || Math.abs(lo) > 180) return null;
  return { lat: la, lon: lo };
}

function renderMapa(geometrias) {
  const container = document.getElementById("mapa-container");
  const semGeo    = document.getElementById("sem-geometria");
  const loading   = document.getElementById("loading-mapa");
  if (loading) loading.style.display = "none";

  // Normaliza e filtra coordenadas (suporta formato decimal e escalonado)
  const pontos = (geometrias || [])
    .map(g => ({ ...g, _coord: normalizarCoordenada(g.Latitude, g.Longitude) }))
    .filter(g => g._coord !== null);

  if (pontos.length === 0) {
    semGeo.style.display = "block";
    return;
  }

  container.style.display = "block";

  const initMap = () => {
    const { lat, lon } = pontos[0]._coord;

    // Força o container a ter dimensões antes de inicializar o Leaflet
    const mapaEl = document.getElementById("mapa");
    mapaEl.style.height = "420px";
    mapaEl.style.width  = "100%";

    const map = L.map("mapa", { preferCanvas: true }).setView([lat, lon], 16);

    // Corrige tamanho após o container ser exibido (estava display:none)
    setTimeout(() => map.invalidateSize(), 100);

    // Tiles OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Ícone personalizado nas cores do portal (navy + amarelo)
    const icone = L.divIcon({
      className: "",
      html: `<div style="
        width:36px; height:36px;
        background: linear-gradient(135deg,#1e3a6e,#f0b429);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid #fff;
        box-shadow: 0 2px 10px rgba(0,0,0,0.5);
      "></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -40],
    });

    pontos.forEach(p => {
      const { lat, lon } = p._coord;
      const desc = p.DescricaoGeometria || "Ponto da obra";
      const end  = p.Endereco ? `<br/><small style="color:#aaa">${p.Endereco}</small>` : "";

      L.marker([lat, lon], { icon: icone })
        .addTo(map)
        .bindPopup(`<strong>${desc}</strong>${end}`, { maxWidth: 280 })
        .openPopup();
    });

    if (pontos.length > 1) {
      map.fitBounds(
        pontos.map(p => [p._coord.lat, p._coord.lon]),
        { padding: [40, 40] }
      );
    }
  };

  if (typeof L !== "undefined") initMap();
  else {
    const iv = setInterval(() => {
      if (typeof L !== "undefined") { clearInterval(iv); initMap(); }
    }, 200);
  }
}



// Ícone por tipo de documento
function iconeDocumento(tipo) {
  const t = (tipo || "").toLowerCase();
  if (t.includes("foto"))           return "📷";
  if (t.includes("boletim") || t.includes("medição")) return "📊";
  if (t.includes("aditivo") || t.includes("termo"))   return "📋";
  if (t.includes("ordem"))         return "📌";
  if (t.includes("contrato") || t.includes("instrumento")) return "📄";
  return "📎";
}

function renderDocumentos(docs) {
  const section = document.getElementById("section-docs");
  const grid    = document.getElementById("docs-grid");
  const empty   = document.getElementById("sem-docs");
  const loading = document.getElementById("loading-docs");
  if (loading) loading.style.display = "none";
  if (section) section.style.display = "block";

  if (!docs || docs.length === 0) {
    if (empty) empty.style.display = "block";
    return;
  }

  // Agrupa por tipo
  const grupos = {};
  docs.forEach(d => {
    if (!grupos[d.tipo]) grupos[d.tipo] = [];
    grupos[d.tipo].push(d);
  });

  grid.innerHTML = Object.entries(grupos).map(([tipo, itens]) => `
    <div class="doc-grupo">
      <div class="doc-grupo-titulo">
        <span>${iconeDocumento(tipo)}</span>
        <span>${tipo}</span>
        <span class="doc-grupo-count">${itens.length}</span>
      </div>
      ${itens.map(doc => `
        <a
          href="${doc.link}"
          target="_blank"
          rel="noopener noreferrer"
          class="doc-card ${doc.sigiloso ? "doc-sigiloso" : ""}"
          title="${doc.nomeArquivo || doc.descricao}"
        >
          <div class="doc-card-info">
            <span class="doc-descricao">${doc.descricao}</span>
            ${doc.nomeArquivo && doc.nomeArquivo !== doc.descricao
              ? `<span class="doc-arquivo">${doc.nomeArquivo}</span>`
              : ""}
          </div>
          <span class="doc-baixar">${doc.sigiloso ? "🔒" : "⬇ Baixar"}</span>
        </a>`).join("")}
    </div>`).join("");
}

function renderItens(itens) {
  const section  = document.getElementById("section-itens");
  const tbody    = document.getElementById("itens-tbody");
  const tfoot    = document.getElementById("itens-tfoot");
  const empty    = document.getElementById("sem-itens");
  const loading  = document.getElementById("loading-itens");
  if (loading) loading.style.display = "none";
  if (section) section.style.display = "block";

  if (!itens || itens.length === 0) {
    if (empty) empty.style.display = "block";
    return;
  }

  const totalGeral = itens.reduce((s, i) => s + i.valorTotal, 0);

  tbody.innerHTML = itens.map((item, idx) => `
    <tr>
      <td class="td-num">${idx + 1}</td>
      <td class="td-desc">${item.descricao}</td>
      <td class="td-center">${item.unidadeMedida}</td>
      <td class="td-right">${item.quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}</td>
      <td class="td-right">${formatMoeda(item.valorUnitario)}</td>
      <td class="td-right td-destaque">${formatMoeda(item.valorTotal)}</td>
    </tr>`).join("");

  if (tfoot) {
    tfoot.innerHTML = `
      <tr class="tfoot-total">
        <td colspan="5"><strong>Total Contratado</strong></td>
        <td class="td-right td-destaque"><strong>${formatMoeda(totalGeral)}</strong></td>
      </tr>`;
  }
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const obraId = params.get("id");

  if (!obraId) {
    document.getElementById("obra-titulo").textContent = "ID da obra não informado.";
    return;
  }

  // Busca obra específica e geometria em paralelo
  const [obras, geometrias] = await Promise.all([
    buscarObras({ obraId }).catch(() => []),
    buscarGeometriaObra(obraId).catch(() => []),
  ]);

  // buscarObras filtra por P083 — se a obra não for desse município, busca direta
  let obra = obras.find(o => String(o.obraId) === String(obraId));
  if (!obra) {
    document.getElementById("obra-titulo").textContent = `Obra #${obraId} não encontrada.`;
    return;
  }

  renderDetalhes(obra);

  // Itens do contrato
  if (obra.instrumentoJuridicoId) {
    try {
      const itens = await buscarItensObra(obra.instrumentoJuridicoId);
      renderItens(itens);
    } catch (e) {
      const el = document.getElementById("loading-itens");
      if (el) el.textContent = `Erro ao carregar itens: ${e.message}`;
    }
  }

  // Documentos do contrato
  if (obra.instrumentoJuridicoId) {
    try {
      const docs = await buscarDocumentosObra(obra.instrumentoJuridicoId);
      renderDocumentos(docs);
    } catch (e) {
      const el = document.getElementById("loading-docs");
      if (el) el.textContent = `Erro ao carregar documentos: ${e.message}`;
    }
  }

  // Execução financeira
  try {
    const exec = await buscarExecucaoObra(obraId);
    renderExecucao(exec);
  } catch (e) {
    const el = document.getElementById("loading-execucao");
    if (el) el.textContent = `Erro: ${e.message}`;
  }

  // Mapa — usa geometrias da API (podem ter mais pontos que o normalizado)
  renderMapa(geometrias);
}

document.addEventListener("DOMContentLoaded", init);
