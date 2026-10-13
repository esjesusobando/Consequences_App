import { Project, Issue, Product, Warehouse, ProviderProposal, AuditLog, PurchaseOrder } from "./types";

// === PROJECTS (Spanish - goal, scope, out of scope) ===
export const INITIAL_PROJECTS: Project[] = [
  {
    id: "PROJ-OS",
    name: "Núcleo Personal OS (Supernatural Spaces)",
    goal: "Crear una interfaz de usuario inmersiva, minimalista y ultra elegante inspirada en Supernatural Mail, integrada con un co-working con IA, extractor OCR real con Gemini 3.5 y reproductor de audio ambiental para maxima concentracion.",
    scope: "Estética limpia flotante, sliders de desenfoque de fondo en tiempo real, selección de imágenes inspiradoras de fondo de alta resolución, panel OCR de carga directa capaz de interactuar con la API de Google Gemini, bloc de notas interactivo estilo Codex.",
    outOfScope: "Guardado permanente en servidores SQL externos (la base local se almacena en memoria de la pestaña y localStorage, preservando agilidad).",
    status: "active"
  },
  {
    id: "PROJ-OPS",
    name: "Operaciones Industriales & Almacenes",
    goal: "Sistematizar la cadena de suministro con un gestor completo de productos con SKU únicos, variantes personalizables, traslados entre múltiples ubicaciones físicas de almacenamiento y alertas automáticas de nivel crítico de inventario.",
    scope: "CRUD dinámico de artículos, creación rápida de variantes, comparación científica entre tiempos y costos de entrega de proveedores, emisión y recepción de órdenes de compra con visor integrado, control estricto de transferencias entre bodegas.",
    outOfScope: "Conexión directa con transportistas de encomiendas mundiales (DHL/FedEx de manera nativa).",
    status: "active"
  },
  {
    id: "PROJ-ANA",
    name: "Métricas Avanzadas, Reportes & Auditoría",
    goal: "Proveer un cuadro de mandos ejecutivo con analíticas clave (productos más vendidos, valuación de stock, rotaciones de inventario) integrado con exportaciones reales y auditoría forense.",
    scope: "Reportes interactivos descargables en formato CSV real, simulación visual premium de PDF y planillas Excel, generador inteligente de códigos QR/Barras listos para imprimir, historial secuencial inmutable contra auditorías de stocks.",
    outOfScope: "Integración directa con el sistema tributario nacional de facturación electrónica.",
    status: "planning"
  }
];

// === INITIAL ISSUES WITH PRIORITIES, ESTIMATES, DATES, & CRITERIA ===
export const INITIAL_ISSUES: Issue[] = [
  // Project: OS Workspace
  {
    id: "ISS-OS-101",
    projectId: "PROJ-OS",
    title: "Implementar personalizador de ambiente estético (Estilo Supernatural Mail)",
    description: "Crear el componente controlador de diseño capaz de alternar presets visuales, regular el desenfoque de fondo (blurred glass overlay) y reproducir audio lo-fi.",
    priority: "high",
    timeEstimate: "4h",
    dateEstimate: "2026-06-08",
    status: "done",
    acceptanceCriteria: [
      "Permitir alternar entre 4 fondos premium de alta fidelidad.",
      "Ofrecer slider de control de desenfoque (backdrop-blur) de 0px a 24px.",
      "Controlador de volumen fluido con interruptor on/off estéreo."
    ]
  },
  {
    id: "ISS-OS-102",
    projectId: "PROJ-OS",
    title: "Integrar extractor de texto OCR impulsado por Gemini 3.5-Flash",
    description: "Configurar un área 'drag-and-drop' interactiva para soltar imágenes y disparar la llamada al backend real que se conecta con la IA de Google para extraer texto.",
    priority: "high",
    timeEstimate: "8h",
    dateEstimate: "2026-06-10",
    status: "in_progress",
    acceptanceCriteria: [
      "Aceptar formatos .png, .jpg y .webp directamente.",
      "Hacer llamada POST real al endpoint de Express `/api/ocr`.",
      "Mostrar animación de escaneo láser luminiscente durante el análisis.",
      "Proveer botón rápido para copiar el texto recuperado al portapapeles."
    ]
  },
  {
    id: "ISS-OS-103",
    projectId: "PROJ-OS",
    title: "Creación de consola Co-Work con IA interactiva y Codex editor",
    description: "Vincular el bloc de notas central a una terminal de consulta Claude-style para escribir documentos sintéticos de forma conjunta.",
    priority: "medium",
    timeEstimate: "6h",
    dateEstimate: "2026-06-11",
    status: "todo",
    acceptanceCriteria: [
      "Contar con un editor interactivo de texto de doble columna.",
      "Columna izquierda: notas. Columna derecha: chat interactivo con IA.",
      "Soportar descarga rápida del borrador en formato plano."
    ]
  },
  // Project: Operations
  {
    id: "ISS-OPS-201",
    projectId: "PROJ-OPS",
    title: "Desarrollo del submódulo CRUD de Productos y Gestión de Variantes",
    description: "Maquetar la hoja de inventario donde el usuario ingresa categorías, nombres base y desglosa variantes con SKU independientes, precios y costos diferenciados.",
    priority: "high",
    timeEstimate: "12h",
    dateEstimate: "2026-06-09",
    status: "in_progress",
    acceptanceCriteria: [
      "Validación de SKU únicos para evitar colisiones.",
      "Generación automática de variantes configurando modificadores.",
      "Formulario ágil para registrar costos base de adquisición y precios públicos."
    ]
  },
  {
    id: "ISS-OPS-202",
    projectId: "PROJ-OPS",
    title: "Comparador analítico de Proveedores (Costos vs Tiempos)",
    description: "Generar algoritmos visuales estadísticos y gráficos de barras para evaluar cuál de los proveedores activos ofrece la mejor combinación logística.",
    priority: "medium",
    timeEstimate: "5h",
    dateEstimate: "2026-06-12",
    status: "todo",
    acceptanceCriteria: [
      "Mostrar gráfica comparativa clara entre costos y días de flete.",
      "Calcular puntaje de confiabilidad para cada transportista.",
      "Destacar visualmente al proveedor con el 'Mejor Retorno Optimo'."
    ]
  },
  {
    id: "ISS-OPS-203",
    projectId: "PROJ-OPS",
    title: "Módulo de Órdenes de Compra con control de flujo logístico",
    description: "Permitir emitir órdenes, simular el envío por email, y registrar la recepción de mercadería actualizando el stock automáticamente.",
    priority: "medium",
    timeEstimate: "7h",
    dateEstimate: "2026-06-13",
    status: "todo",
    acceptanceCriteria: [
      "Generar documento formal de Purchase Order con status progresivo.",
      "Botón de 'Recibir inventario' que incremente la existencia del almacén seleccionado.",
      "Archivar la orden completada y registrar el movimiento en auditoría."
    ]
  },
  {
    id: "ISS-OPS-204",
    projectId: "PROJ-OPS",
    title: "Gestor Multi-Almacén y transferencias internas inmediatas",
    description: "Configurar al menos 3 ubicaciones de depósito (Norte, Sur, Central) para mover stock de un punto a otro registrando tránsitos.",
    priority: "high",
    timeEstimate: "6h",
    dateEstimate: "2026-06-11",
    status: "todo",
    acceptanceCriteria: [
      "Selector origen y destino de almacenes.",
      "Restar stock en origen y sumarlo en destino tras confirmar.",
      "Bloquear la transferencia si las unidades origen no son suficientes."
    ]
  }
];

// === INITIAL WAREHOUSES ===
export const INITIAL_WAREHOUSES: Warehouse[] = [
  { id: "WH-CENTRAL", name: "Almacen Central (General)", location: "Zona Industrial Norte, Col. Metrópolis" },
  { id: "WH-SUR", name: "Almacen Sucursal Sur", location: "Av. Las Calandrias, Plaza Sur Nivel Logístico" },
  { id: "WH-MAQUILA", name: "Almacen Planta Maquiladora", location: "Complejo de Alta Tecnología Escobedo" }
];

// === INITIAL PRODUCTS DATA WITH VARIANTS & CROSS-STORE STOCK ===
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "PROD-A",
    sku: "AURA-CORE-V5",
    name: "Procesador Cuántico Aura Core V5",
    category: "Hardware",
    variants: [
      {
        sku: "AURA-V5-SILVER",
        name: "Aura V5 (Edición Silver Core)",
        price: 950.00,
        cost: 420.00,
        stock: { "WH-CENTRAL": 12, "WH-SUR": 3, "WH-MAQUILA": 15 },
        expiringDate: "2028-12-31"
      },
      {
        sku: "AURA-V5-PLATINUM",
        name: "Aura V5 (Edición Platinum Core Limitada)",
        price: 1350.00,
        cost: 600.00,
        stock: { "WH-CENTRAL": 4, "WH-SUR": 1, "WH-MAQUILA": 2 },
        expiringDate: "2028-12-31"
      }
    ]
  },
  {
    id: "PROD-B",
    sku: "SENS-GLOW-X9",
    name: "Sensor de Luminescencia Glow X9",
    category: "Optoelectrónica",
    variants: [
      {
        sku: "GLOW-X9-RED",
        name: "Glow X9 (Banda de Onda Roja 620nm)",
        price: 85.00,
        cost: 32.00,
        stock: { "WH-CENTRAL": 85, "WH-SUR": 20, "WH-MAQUILA": 120 },
        expiringDate: "2027-06-30"
      },
      {
        sku: "GLOW-X9-BLUE",
        name: "Glow X9 (Banda de Onda Azul Violeta 410nm)",
        price: 99.00,
        cost: 41.00,
        stock: { "WH-CENTRAL": 1, "WH-SUR": 0, "WH-MAQUILA": 15 }, // Critical stock on WH-SUR and WH-CENTRAL!
        expiringDate: "2027-06-30"
      }
    ]
  },
  {
    id: "PROD-C",
    sku: "CABLE-GIGA-T6",
    name: "Cable Conductor Super Giga T6",
    category: "Cableado",
    variants: [
      {
        sku: "GIGA-T6-10M",
        name: "Cable Giga T6 (Longitud 10 Metros Blindado)",
        price: 35.00,
        cost: 12.00,
        stock: { "WH-CENTRAL": 18, "WH-SUR": 22, "WH-MAQUILA": 300 },
        expiringDate: "2031-10-15"
      },
      {
        sku: "GIGA-T6-50M",
        name: "Cable Giga T6 (Longitud 50 Metros Bobina Extensa)",
        price: 110.00,
        cost: 45.00,
        stock: { "WH-CENTRAL": 2, "WH-SUR": 4, "WH-MAQUILA": 80 },
        expiringDate: "2031-10-15"
      }
    ]
  }
];

// === INITIAL PROVIDERS PROPOSALS FOR COMPARISON ===
export const INITIAL_PROVIDERS_PROPOSALS: ProviderProposal[] = [
  { providerName: "Asiátia Optronics Corp", cost: 3200, deliveryDays: 14, reliabilityScore: 94 },
  { providerName: "Logística Europea Express", cost: 4100, deliveryDays: 4, reliabilityScore: 98 },
  { providerName: "Nacional Distribuidora S.A.", cost: 3500, deliveryDays: 8, reliabilityScore: 89 },
  { providerName: "Global Tech Supplies Inc", cost: 3800, deliveryDays: 7, reliabilityScore: 96 }
];

// === INITIAL AUDIT LOGS ===
export const INITIAL_AUDITS: AuditLog[] = [
  { id: "AUD-001", timestamp: "14:12:00", module: "SYSTEM", action: "BOOT", user: "ia.strongmagazine@gmail.com", detail: "Inicio de Personal OS - Versión R-1.0.0 inicializada" },
  { id: "AUD-002", timestamp: "14:15:32", module: "PRODUCTOS", action: "EDICIÓN", user: "ia.strongmagazine@gmail.com", detail: "AURA-V5-SILVER stock actualizado en WH-CENTRAL: 12 unidades disponibles." },
  { id: "AUD-003", timestamp: "14:32:11", module: "ALMACEN", action: "CREACIÓN", user: "ia.strongmagazine@gmail.com", detail: "Nuevo Almacén WH-MAQUILA creado e incorporado a la matriz de inventario." }
];

// === INITIAL PURCHASE ORDERS ===
export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "PO-2026-001",
    orderNumber: "OC-4890",
    providerName: "Asiátia Optronics Corp",
    createdAt: "2026-06-05",
    status: "recibida",
    items: [
      { sku: "AURA-V5-SILVER", qty: 5, cost: 420.00 },
      { sku: "GLOW-X9-RED", qty: 20, cost: 32.00 }
    ]
  },
  {
    id: "PO-2026-002",
    orderNumber: "OC-4891",
    providerName: "Global Tech Supplies Inc",
    createdAt: "2026-06-07",
    status: "enviada",
    items: [
      { sku: "AURA-V5-PLATINUM", qty: 2, cost: 600.00 }
    ]
  }
];

// === CUSTOM PRESENTATION CONFIG PRESETS ===
export const BACKGROUND_PRESETS = [
  {
    id: "cyber-neon",
    name: "Neon Metropoli Void",
    url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=1200&q=80",
    desc: "Un ambiente ciberpunk oscuro con luces neón contrastantes."
  },
  {
    id: "editorial-serif",
    name: "Editorial Charcoal Minimalist",
    url: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=1200&q=80",
    desc: "Tonos grises orgánicos, piedras monolíticas y calma absoluta."
  },
  {
    id: "mystic-valley",
    name: "Cosmic Nebula Dust",
    url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1200&q=80",
    desc: "Polvo cósmico, estrellas lejanas y resplandor púrpura profundo."
  },
  {
    id: "industrial-structure",
    name: "Industrial Steel Grid",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    desc: "Estructura rígida de metal y concreto con alto sentido técnico."
  }
];

export const AMBIENT_TRACKS = [
  { id: "synth-pad", name: "Consequences Deep Drone", desc: "Sintetizador inmersivo profundo", duration: "03:45" },
  { id: "lofi-rain", name: "Retro Tokyo Raindrops", desc: "Gotas de lluvia con acordes lo-fi", duration: "04:12" },
  { id: "cosmic-wind", name: "Solar Wind Echoes", desc: "Ambiente espacial resonante de fase", duration: "05:00" }
];
