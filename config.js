/**
 * config.js - Configurações do Portal de Obras
 * 
 * Use este arquivo para personalizar o comportamento do filtro
 * sem precisar modificar o código principal
 */

export const CONFIG = {
  // ========================================
  // FILTRO DE UNIDADE JURISDICIONADA
  // ========================================
  
  /**
   * Padrões para identificar a Prefeitura Municipal
   * Aceita expressões regulares (regex)
   */
  PREFEITURA_PATTERNS: [
    /prefeitura\s+municipal\s+(do|de)?\s*jaboat[ãa]o/i,
    /^prefeitura\s+municipal$/i,
    /pmjg/i,
  ],

  /**
   * Comportamento quando a obra NÃO tem informação de unidade
   * 
   * true  = INCLUIR obra (mais permissivo - pode incluir dados antigos)
   * false = EXCLUIR obra (mais restritivo - apenas obras com dados completos)
   */
  INCLUIR_SEM_UNIDADE: true,

  /**
   * Subunidades a EXCLUIR (se necessário)
   * Deixe vazio [] para não excluir nenhuma subunidade
   * 
   * Exemplo:
   * SUBUNIDADES_EXCLUIDAS: [
   *   "Secretaria de Obras",
   *   "Autarquia XYZ"
   * ]
   */
  SUBUNIDADES_EXCLUIDAS: [],

  /**
   * Unidades a INCLUIR explicitamente (além da Prefeitura)
   * Útil se houver autarquias ou fundações municipais
   * 
   * Exemplo:
   * UNIDADES_ADICIONAIS: [
   *   "Fundação de Cultura",
   *   "Autarquia de Saneamento"
   * ]
   */
  UNIDADES_ADICIONAIS: [],

  // ========================================
  // PERFORMANCE
  // ========================================
  
  /**
   * Tamanho do lote para buscar instrumentos jurídicos
   * Valores menores = mais lento mas menos sobrecarga
   * Valores maiores = mais rápido mas mais requisições simultâneas
   */
  BATCH_SIZE: 10,

  /**
   * Buscar secretaria no processo de contratação quando o instrumento não tiver subunidade
   */
  SECRETARIA_FALLBACK_PROCESSO: true,

  /**
   * Buscar nome da secretaria no catálogo TCEPE pelo ID da subunidade
   */
  SECRETARIA_FALLBACK_CATALOGO: true,

  /**
   * Timeout para requisições (em milissegundos)
   */
  REQUEST_TIMEOUT: 30000,

  /**
   * Timeout só para participantes (API costuma ser mais lenta; não bloqueia a lista)
   */
  PARTICIPANTES_TIMEOUT: 15000,

  /**
   * Timeout para buscar instrumento jurídico (secretaria)
   */
  INSTRUMENTO_TIMEOUT: 20000,

  /**
   * Fonte principal do nome da empresa: ObrasDadosContratacao (TCEPE id=31)
   * https://sistemas.tcepe.tc.br/DadosAbertos/Exemplo!detalhar?dadosAbertos.id=31
   */
  USAR_OBRAS_DADOS_CONTRATACAO: false,

  // ========================================
  // INTERFACE
  // ========================================
  
  /**
   * Mostrar contador de obras filtradas
   */
  MOSTRAR_CONTADOR_FILTRADAS: false,

  /**
   * Mostrar nome da unidade jurisdicionada nos cards
   */
  MOSTRAR_UNIDADE_NOS_CARDS: false,

  /**
   * Texto para obras sem descrição adequada
   */
  TEXTO_SEM_DESCRICAO: "Obra sem descrição disponível",

  // ========================================
  // DEBUG
  // ========================================
  
  /**
   * Modo debug - exibe logs no console
   */
  DEBUG_MODE: false,

  /**
   * Modo de teste - não aplica filtro de unidade
   * (útil para verificar quantas obras estão sendo filtradas)
   */
  MODO_TESTE_SEM_FILTRO: false,
};

/**
 * Função auxiliar para verificar se uma unidade deve ser incluída
 */
export function deveIncluirUnidade(unidadeNome, subunidadeNome = null) {
  if (!unidadeNome) {
    return CONFIG.INCLUIR_SEM_UNIDADE;
  }

  // Verificar se está nas unidades adicionais
  if (CONFIG.UNIDADES_ADICIONAIS.length > 0) {
    const incluida = CONFIG.UNIDADES_ADICIONAIS.some(u => 
      unidadeNome.toLowerCase().includes(u.toLowerCase())
    );
    if (incluida) return true;
  }

  // Verificar se está nas subunidades excluídas
  if (subunidadeNome && CONFIG.SUBUNIDADES_EXCLUIDAS.length > 0) {
    const excluida = CONFIG.SUBUNIDADES_EXCLUIDAS.some(s =>
      subunidadeNome.toLowerCase().includes(s.toLowerCase())
    );
    if (excluida) return false;
  }

  // Verificar padrões da prefeitura
  return CONFIG.PREFEITURA_PATTERNS.some(pattern => pattern.test(unidadeNome));
}

/**
 * Função de log condicional
 */
export function debugLog(...args) {
  if (CONFIG.DEBUG_MODE) {
    console.log('[OBRAS DEBUG]', ...args);
  }
}
