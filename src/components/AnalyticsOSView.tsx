import React, { useState } from 'react';
import { Product, AuditLog, Warehouse } from '../types';
import { 
  TrendingUp, 
  DollarSign, 
  Calculator, 
  FileSpreadsheet, 
  QrCode, 
  History, 
  Mail, 
  Percent, 
  ArrowDownToLine, 
  Printer, 
  RefreshCw, 
  CheckCircle2, 
  HelpCircle,
  BarChart2,
  PieChart
} from 'lucide-react';

interface AnalyticsOSViewProps {
  products: Product[];
  audits: AuditLog[];
  warehouses: Warehouse[];
  onLogMessage: (type: 'info' | 'ok' | 'warn' | 'err', text: string) => void;
}

export default function AnalyticsOSView({
  products,
  audits,
  warehouses,
  onLogMessage
}: AnalyticsOSViewProps) {
  // Barcode / QR State
  const [barcodeSKU, setBarcodeSKU] = useState<string>('AURA-V5-SILVER');
  const [barcodeType, setBarcodeType] = useState<'barcode' | 'qr'>('qr');

  // Email Config State
  const [emailAlerts, setEmailAlerts] = useState<string>('ia.strongmagazine@gmail.com');
  const [isAlertActive, setIsAlertActive] = useState<boolean>(true);
  const [isBackupMonthly, setIsBackupMonthly] = useState<boolean>(true);

  // Math Valuation analysis (SOTA standard)
  let totalInventoryValuation = 0;
  let totalUnitsCount = 0;

  products.forEach(p => {
    p.variants.forEach(v => {
      const variantStockSum = Object.values(v.stock).reduce((acc, qty) => acc + qty, 0);
      totalUnitsCount += variantStockSum;
      totalInventoryValuation += variantStockSum * v.cost;
    });
  });

  // Calculate generic simulated turnover rate metrics
  const simulatedTurnoverRate = 12.4; // standard SOTA industrial rotation index (12.4x / year)

  // Download real formatted .csv sheet
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "SKU,Nombre Producto,Venta (USD),Costo (USD),Cantidad Central,Cantidad Sur,Cantidad Maquila,Valuación Inventario\n";

    products.forEach(p => {
      p.variants.forEach(v => {
        const whCentral = v.stock["WH-CENTRAL"] || 0;
        const whSur = v.stock["WH-SUR"] || 0;
        const whMaquila = v.stock["WH-MAQUILA"] || 0;
        const totalStock = whCentral + whSur + whMaquila;
        const valuation = totalStock * v.cost;

        csvContent += `"${v.sku}","${v.name}",${v.price},${v.cost},${whCentral},${whSur},${whMaquila},${valuation}\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `auditoria_inventario_sota_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    onLogMessage('ok', 'Planilla de inventario exportada con éxito en formato estructurado .csv');
  };

  const handlePrintLabel = () => {
    onLogMessage('ok', `Comando de impresión de etiqueta alfanumérica enviado para el SKU [${barcodeSKU}]`);
    window.print();
  };

  const handleSaveNotificationConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onLogMessage('ok', `Configuración guardada. Destinatario de emergencias: ${emailAlerts}`);
  };

  return (
    <div id="analytics-container" className="flex-1 p-6 md:p-8 overflow-y-auto z-10 custom-scrollbar select-none text-on-surface">
      
      {/* CUADROS PRINCIPALES DE RESUMEN METRICAS (BENTO GRIDS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Metric Card 1: Valuation Total */}
        <div className="bg-carbon/25 border border-graphite/45 rounded-xl p-5 flex items-center justify-between backdrop-blur-md relative overflow-hidden">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-widest text-ash">VALORACIÓN TOTAL DEL INVENTARIO</span>
            <span className="text-2xl font-bold font-mono text-glow-cyan text-signal-cyan">
              ${totalInventoryValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
            <span className="text-[10px] text-slate font-mono uppercase">Existencias totales: {totalUnitsCount} unidades</span>
          </div>
          <DollarSign className="w-10 h-10 text-signal-cyan/25 absolute right-4 top-5" />
        </div>

        {/* Metric Card 2: Rotation Index */}
        <div className="bg-carbon/25 border border-graphite/45 rounded-xl p-5 flex items-center justify-between backdrop-blur-md relative overflow-hidden">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-widest text-ash">ROTACIÓN DE INVENTARIO (ROT)</span>
            <span className="text-2xl font-bold font-mono text-[#C6FF3D] text-glow-lime">
              {simulatedTurnoverRate.toFixed(1)}x / Año
            </span>
            <span className="text-[10px] text-slate font-mono uppercase">Rendimiento: Élite Industrial (SOTA)</span>
          </div>
          <Percent className="w-10 h-10 text-signal-lime/20 absolute right-4 top-5" />
        </div>

        {/* Metric Card 3: Best Seller */}
        <div className="bg-carbon/25 border border-graphite/45 rounded-xl p-5 flex items-center justify-between backdrop-blur-md relative overflow-hidden">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-widest text-ash">PRESELECCIÓN DE PRODUCTOS POPULARES</span>
            <span className="text-sm font-bold text-bone truncate max-w-sm">
              Quantum Aura Core V5
            </span>
            <span className="text-[10px] text-signal-cyan font-mono uppercase bg-[#00F0FF]/10 px-1.5 py-0.5 rounded border border-signal-cyan/15 self-start">
              SKU: AURA-V5-SILVER
            </span>
          </div>
          <TrendingUp className="w-10 h-10 text-signal-magenta/15 absolute right-4 top-5" />
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA PRINCIPAL DE ANALÍTICAS */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* SECCIÓN EXPORTACIÓN DE REPORTES Y DESCARGAS CSV REALES */}
          <div className="bg-carbon/25 border border-graphite/45 backdrop-blur-md rounded-xl p-5 flex flex-col gap-4">
            <div className="border-b border-graphite/30 pb-2.5 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-bone flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-signal-lime" />
                  Módulo de Reportes Forenses & Documentos Descarables
                </h3>
                <span className="text-[9px] text-ash font-mono block mt-1">Exportación en vivo del estado contable y logístico.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* CSV Exporter Action Block */}
              <div className="p-4 rounded-xl border border-graphite/40 bg-void/50 flex flex-col gap-2.5 justify-between">
                <div>
                  <h4 className="text-xs font-bold font-body text-bone">Base de Datos de Inventario (.CSV)</h4>
                  <p className="text-[10.5px] text-slate leading-relaxed mt-1">
                    Crea y descarga instantáneamente el listado completo de SKUs, variantes, costos, y existencias filtradas por bodega en formato estándar CSV.
                  </p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="py-1.5 bg-signal-lime hover:bg-opacity-95 text-void font-bold font-mono text-[10px] uppercase rounded-lg tracking-wider flex items-center justify-center gap-1.5 select-pointer"
                >
                  <ArrowDownToLine className="w-4 h-4" /> Exportar Planilla CSV Real
                </button>
              </div>

              {/* Generador Premium PDF & Excel Mocks */}
              <div className="p-4 rounded-xl border border-graphite/40 bg-void/50 flex flex-col gap-2.5 justify-between">
                <div>
                  <h4 className="text-xs font-bold font-body text-bone">Reporte de Auditoría Ejecutiva (.PDF)</h4>
                  <p className="text-[10.5px] text-slate leading-relaxed mt-1">
                    Genera el balance fiscal y valuación de los tres almacenes principales. El motor compilará la información a una factura premium estilizada.
                  </p>
                </div>
                <button
                  onClick={() => onLogMessage('ok', 'Sintetizando balance de auditoría PDF ejecutiva... Descargando visualizadores estéticos.')}
                  className="py-1.5 bg-transparent border border-signal-cyan/35 hover:border-signal-cyan text-signal-cyan font-bold font-mono text-[10px] uppercase rounded-lg tracking-wider flex items-center justify-center gap-1.5 select-pointer"
                >
                  <ArrowDownToLine className="w-4 h-4" /> Emitir PDF de Rendimiento
                </button>
              </div>

            </div>
          </div>

          {/* GENERACIÓN INTELIGENTE DE CÓDIGOS DE BARRA Y QR */}
          <div className="bg-carbon/25 border border-graphite/45 backdrop-blur-md rounded-xl p-5 flex flex-col gap-4">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-bone flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-signal-cyan" />
                Matriz Generadora de Códigos de Barras & QR (Etiq. Logística)
              </h3>
              <p className="text-[9.5px] text-slate font-mono block mt-1 uppercase">
                Renderiza inmediatamente etiquetas imprimibles para adherir a empaques de bodega física.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
              
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-mono text-slate uppercase">Selecciona Variant SKU</label>
                  <select
                    value={barcodeSKU}
                    onChange={(e) => setBarcodeSKU(e.target.value)}
                    className="bg-[#04060A] border border-graphite text-xs p-2 text-bone rounded outline-none font-mono uppercase"
                  >
                    {products.map(p => 
                      p.variants.map(v => (
                        <option key={v.sku} value={v.sku}>{v.sku}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-mono text-slate uppercase">Tipo de Etiqueta</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBarcodeType('qr')}
                      className={`flex-1 py-1 text-[10px] uppercase font-mono font-bold rounded border ${barcodeType === 'qr' ? 'bg-signal-cyan/10 border-signal-cyan text-signal-cyan' : 'bg-void border-graphite text-slate'}`}
                    >
                      Biológico QR Code
                    </button>
                    <button
                      onClick={() => setBarcodeType('barcode')}
                      className={`flex-1 py-1 text-[10px] uppercase font-mono font-bold rounded border ${barcodeType === 'barcode' ? 'bg-signal-cyan/10 border-signal-cyan text-signal-cyan' : 'bg-void border-graphite text-slate'}`}
                    >
                      Barcode 1D
                    </button>
                  </div>
                </div>

                <button
                  onClick={handlePrintLabel}
                  className="w-full py-2 bg-graphite hover:bg-graphite/80 border border-graphite/80 hover:text-bone text-xs font-mono font-bold uppercase rounded-lg flex items-center justify-center gap-1.5 text-slate select-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Mandar a Impresión
                </button>
              </div>

              {/* RENDER AD-HOC DE CÓDIGOS DE ESCANEO */}
              <div className="bg-void/70 border border-graphite/60 rounded-xl p-5 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden">
                
                {barcodeType === 'qr' ? (
                  <>
                    {/* Simulated High fidelity geometric QR code vector */}
                    <div className="w-24 h-24 border-2 border-bone p-1.5 bg-white rounded-md flex flex-wrap gap-1 justify-center items-center">
                      {Array.from({ length: 49 }).map((_, i) => {
                        const filled = (i * 7 + 13) % 4 === 0 || i < 7 || i % 7 === 0 || i % 7 === 6 || i > 42;
                        return (
                          <div 
                            key={i} 
                            className={`w-2.5 h-2.5 transition-all ${filled ? 'bg-black' : 'bg-transparent'}`} 
                          />
                        );
                      })}
                    </div>
                    <span className="text-[9.5px] font-mono text-bone tracking-widest uppercase mt-3">{barcodeSKU}</span>
                  </>
                ) : (
                  <>
                    {/* Simulated Barcode */}
                    <div className="flex items-center justify-center gap-1 h-14 w-40 bg-white p-2 border border-slate rounded">
                      {[2,4,1,3,2,1,4,2,3,1,2,4,1,3,2,1,4,2,1,3].map((width, idx) => (
                        <div 
                          key={idx} 
                          className="bg-black h-full"
                          style={{ width: `${width}px` }}
                        />
                      ))}
                    </div>
                    <span className="text-[9.5px] font-mono text-bone tracking-widest uppercase mt-3">{barcodeSKU}</span>
                  </>
                )}

              </div>

            </div>
          </div>

        </div>

        {/* COLUMNA LATERAL: REGISTRO HISTORICO AUDITORÍA Y NOTIFICACIONES */}
        <aside className="flex flex-col gap-6">
          
          {/* ALTIMERA DE REGISTROS DE AUDITORÍA FORENSE SOTA */}
          <div className="bg-carbon/25 border border-graphite/45 backdrop-blur-md rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#ECEEF5] flex items-center gap-1.5 border-b border-graphite/30 pb-2">
              <History className="w-4 h-4 text-slate" />
              Auditoría Forense de Inventario
            </h3>

            <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1.5 custom-scrollbar">
              {audits.map((item) => (
                <div key={item.id} className="p-2.5 bg-[#04060A]/60 border border-graphite/35 rounded-lg flex flex-col gap-1 text-[10px] font-mono">
                  <div className="flex justify-between items-center text-[8.5px]">
                    <span className="text-signal-cyan font-bold uppercase">{item.module} :: {item.action}</span>
                    <span className="text-slate">{item.timestamp}</span>
                  </div>
                  <p className="text-bone/80 leading-normal mt-0.5">
                    {item.detail}
                  </p>
                  <span className="text-[8px] text-[#5A6380] uppercase truncate">Operador: {item.user}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PARÁMETROS NOTIFICACIONES EMAIL */}
          <div className="bg-carbon/25 border border-graphite/45 backdrop-blur-md rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#ECEEF5] flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate" />
              Disparador de Notificaciones de Emergencia
            </h3>

            <form onSubmit={handleSaveNotificationConfig} className="flex flex-col gap-3 font-mono text-[10.5px]">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-ash uppercase">Email de supervisor directivo</label>
                <input 
                  type="email" 
                  value={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.value)}
                  className="bg-[#04060A] border border-graphite rounded p-2 text-bone outline-none focus:border-signal-cyan"
                  required
                />
              </div>

              {/* Slider / Toggles details representation */}
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex justify-between items-center bg-void/50 p-2.5 rounded border border-graphite/30">
                  <span className="text-slate">DISPARAR ALERTAS STOCK BAJO:</span>
                  <input 
                    type="checkbox" 
                    checked={isAlertActive}
                    onChange={() => setIsAlertActive(!isAlertActive)}
                    className="accent-signal-cyan w-3.5 h-3.5 cursor-pointer"
                  />
                </div>
                <div className="flex justify-between items-center bg-void/50 p-2.5 rounded border border-graphite/30">
                  <span className="text-slate">COPIA MENSUAL INFORME:</span>
                  <input 
                    type="checkbox" 
                    checked={isBackupMonthly}
                    onChange={() => setIsBackupMonthly(!isBackupMonthly)}
                    className="accent-signal-cyan w-3.5 h-3.5 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-signal-cyan hover:bg-[#00D7E6] text-void font-bold text-xs uppercase rounded transition-colors"
              >
                Guardar Configuración Email
              </button>
            </form>
          </div>

        </aside>

      </div>
    </div>
  );
}
