// exportador.js - Módulo para exportar dados para CSV e Excel

/**
 * Exporta os dados para um arquivo CSV
 * @param {Array} dados - Lista de obras (objetos)
 * @param {string} nomeArquivo - Nome base do arquivo (sem extensão)
 */
export function exportarParaCSV(dados, nomeArquivo = "obras_exportadas") {
  if (!dados || dados.length === 0) {
    alert("Não há dados para exportar.");
    return;
  }

  // Mapear os campos relevantes
  const dadosExportacao = dados.map(obra => ({
    "Objeto": obra.descricaoGeometria || obra.informacoesAdicionais || obra.enderecoFallback || `Obra #${obra.obraId}`,
    "Secretaria": obra.secretariaNome || "Não informada",
    "Fonte Secretaria": obra.secretariaFonte || "—",
    "Empresa Contratada": obra.empresaContratadaNome || "Não informada",
    "CNPJ/CPF Contratado": obra.empresaContratadaDocumentoFormatado || obra.empresaContratadaDocumento || "—",
    "Papel do Contratado": obra.empresaContratadaTipo || "—",
    "Fonte Empresa": obra.empresaContratadaFonte || "—",
    "Situação": obra.situacaoObraNome || "—",
    "Data de Início": formatarDataISO(obra.dataInicioObra),
    "Data de Conclusão": formatarDataISO(obra.dataConclusaoObra),
    "Valor Pago (R$)": parseFloat(obra.totalPago) || 0,
    "Valor Medido (R$)": parseFloat(obra.totalMedido) || 0,
    "ID da Obra": obra.obraId,
    "Instrumento Jurídico": obra.instrumentoJuridicoId || "—",
    "Endereço": obra.endereco || "—"
  }));

  // Criar linhas do CSV
  const headers = Object.keys(dadosExportacao[0]);
  const linhas = dadosExportacao.map(item =>
    headers.map(header => {
      let valor = item[header];
      // Formatar números com vírgula decimal e sem separador de milhar
      if (typeof valor === "number") {
        valor = valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\./g, ",");
      }
      // Escapar aspas e vírgulas
      if (typeof valor === "string" && (valor.includes(",") || valor.includes('"'))) {
        return `"${valor.replace(/"/g, '""')}"`;
      }
      return valor;
    }).join(",")
  );

  const csvConteudo = [headers.join(","), ...linhas].join("\n");
  
  // Adicionar BOM para UTF-8 (corrige acentos no Excel)
  const blob = new Blob(["\uFEFF" + csvConteudo], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute("download", `${nomeArquivo}_${formatarDataArquivo()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta os dados para um arquivo Excel (formato .xls)
 * @param {Array} dados - Lista de obras (objetos)
 * @param {string} nomeArquivo - Nome base do arquivo (sem extensão)
 */
export function exportarParaExcel(dados, nomeArquivo = "obras_exportadas") {
  if (!dados || dados.length === 0) {
    alert("Não há dados para exportar.");
    return;
  }

  const titulo = `Relatório de Obras - ${new Date().toLocaleDateString("pt-BR")}`;
  
  let html = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>${titulo}</title>
    <style>
      th { background: #1a3a6b; color: white; padding: 8px; border: 1px solid #ccc; }
      td { padding: 6px; border: 1px solid #ccc; }
      .valor { text-align: right; }
      .data { text-align: center; }
    </style>
  </head>
  <body>
    <h2>${titulo}</h2>
    <table border="1" cellpadding="5" cellspacing="0">
      <thead>
        <tr>
          <th>Objeto</th>
          <th>Secretaria</th>
          <th>Fonte Secretaria</th>
          <th>Empresa Contratada</th>
          <th>CNPJ/CPF</th>
          <th>Situação</th>
          <th>Data de Início</th>
          <th>Data de Conclusão</th>
          <th>Valor Pago (R$)</th>
          <th>Valor Medido (R$)</th>
          <th>ID da Obra</th>
          <th>Instrumento Jurídico</th>
          <th>Endereço</th>
        </tr>
      </thead>
      <tbody>
  `;

  for (const obra of dados) {
    const objeto = escapeHtml(obra.descricaoGeometria || obra.informacoesAdicionais || obra.enderecoFallback || `Obra #${obra.obraId}`);
    const secretaria = escapeHtml(obra.secretariaNome || "Não informada");
    const fonteSecretaria = escapeHtml(obra.secretariaFonte || "—");
    const empresa = escapeHtml(obra.empresaContratadaNome || "Não informada");
    const docEmpresa = escapeHtml(obra.empresaContratadaDocumentoFormatado || obra.empresaContratadaDocumento || "—");
    const situacao = escapeHtml(obra.situacaoObraNome || "—");
    const inicio = formatarDataISO(obra.dataInicioObra);
    const conclusao = formatarDataISO(obra.dataConclusaoObra);
    const valorPago = (parseFloat(obra.totalPago) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const valorMedido = (parseFloat(obra.totalMedido) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const obraId = obra.obraId;
    const instrumento = obra.instrumentoJuridicoId || "—";
    const endereco = escapeHtml(obra.endereco || "—");

    html += `
      <tr>
        <td>${objeto}</td>
        <td>${secretaria}</td>
        <td>${fonteSecretaria}</td>
        <td>${empresa}</td>
        <td>${docEmpresa}</td>
        <td>${situacao}</td>
        <td class="data">${inicio}</td>
        <td class="data">${conclusao}</td>
        <td class="valor">${valorPago}</td>
        <td class="valor">${valorMedido}</td>
        <td>${obraId}</td>
        <td>${instrumento}</td>
        <td>${endereco}</td>
      </tr>
    `;
  }

  html += `
      </tbody>
    </table>
    <p>Gerado em: ${new Date().toLocaleString("pt-BR")}</p>
    <p>Total de obras: ${dados.length}</p>
  </body>
  </html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute("download", `${nomeArquivo}_${formatarDataArquivo()}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Funções auxiliares
function formatarDataISO(dataStr) {
  if (!dataStr) return "—";
  const dt = new Date(dataStr + "T00:00:00");
  if (isNaN(dt)) return dataStr;
  return dt.toLocaleDateString("pt-BR");
}

function formatarDataArquivo() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}_${String(agora.getHours()).padStart(2, "0")}-${String(agora.getMinutes()).padStart(2, "0")}`;
}

function escapeHtml(texto) {
  if (!texto) return "";
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}