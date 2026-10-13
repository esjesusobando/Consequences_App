import React, { useState } from 'react';
import { Product, Warehouse, ProviderProposal, PurchaseOrder, WarehouseTransfer } from '../types';
import { 
  Boxes, 
  MapPin, 
  Settings, 
  Plus, 
  AlertCircle, 
  TrendingUp, 
  ArrowRightLeft, 
  ShoppingCart, 
  Truck, 
  Calendar, 
  Barcode, 
  DollarSign, 
  History, 
  Bell, 
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Trash2,
  PackageOpen
} from 'lucide-react';

interface OperationsOSViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  warehouses: Warehouse[];
  providers: ProviderProposal[];
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  onLogMessage: (type: 'info' | 'ok' | 'warn' | 'err', text: string) => void;
  onAddAudit: (module: string, action: string, detail: string) => void;
}

export default function OperationsOSView({
  products,
  setProducts,
  warehouses,
  providers,
  purchaseOrders,
  setPurchaseOrders,
  onLogMessage,
  onAddAudit,
}: OperationsOSViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'providers' | 'orders' | 'transfers'>('products');

  // Products CRUD State
  const [selectedProductSKU, setSelectedProductSKU] = useState<string>(products[0]?.sku || '');
  const [showAddProduct, setShowAddProduct] = useState<boolean>(false);
  const [newProdName, setNewProdName] = useState<string>('');
  const [newProdSKU, setNewProdSKU] = useState<string>('');
  const [newProdCat, setNewProdCat] = useState<string>('Hardware');
  // Variant form
  const [variantSKU, setVariantSKU] = useState<string>('');
  const [variantName, setVariantName] = useState<string>('');
  const [variantPrice, setVariantPrice] = useState<number>(100);
  const [variantCost, setVariantCost] = useState<number>(45);
  const [initialCentralStock, setInitialCentralStock] = useState<number>(10);

  // Transfer State
  const [transferSKU, setTransferSKU] = useState<string>('');
  const [transferFromWH, setTransferFromWH] = useState<string>('WH-CENTRAL');
  const [transferToWH, setTransferToWH] = useState<string>('WH-SUR');
  const [transferQty, setTransferQty] = useState<number>(5);

  // New Purchase Order State
  const [orderProvider, setOrderProvider] = useState<string>(providers[0]?.providerName || '');
  const [orderSKU, setOrderSKU] = useState<string>('');
  const [orderQty, setOrderQty] = useState<number>(50);
  const [orderCostItem, setOrderCostItem] = useState<number>(30);

  // Calculation for low stock alerts (SOTA system behavior)
  const lowStockAlerts: { sku: string; variantName: string; stock: number; location: string }[] = [];
  const expirationAlerts: { sku: string; variantName: string; date: string }[] = [];

  products.forEach(p => {
    p.variants.forEach(v => {
      // Stock below 5 is flagged as low stock alert!
      Object.entries(v.stock).forEach(([whId, qty]) => {
        if (qty <= 5) {
          const whName = warehouses.find(w => w.id === whId)?.name || whId;
          lowStockAlerts.push({
            sku: v.sku,
            variantName: v.name,
            stock: qty,
            location: whName
          });
        }
      });
      // Expiration check
      if (v.expiringDate) {
        expirationAlerts.push({
          sku: v.sku,
          variantName: v.name,
          date: v.expiringDate
        });
      }
    });
  });

  const selectedProduct = products.find(p => p.sku === selectedProductSKU) || products[0];

  // Handler: Create Product SKU and default initial variant
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdSKU.trim()) {
      onLogMessage('err', 'Error: El nombre y SKU raíz son campos obligatorios.');
      return;
    }

    // Check SKU collisions
    const collision = products.find(p => p.sku === newProdSKU);
    if (collision) {
      onLogMessage('err', `Error: El SKU raíz [${newProdSKU}] ya está registrado.`);
      return;
    }

    const defaultVariantSKU = `${newProdSKU.toUpperCase()}-STD`;
    const newProductObj: Product = {
      id: `PROD-${Math.floor(Math.random() * 899 + 100)}`,
      sku: newProdSKU.toUpperCase(),
      name: newProdName,
      category: newProdCat,
      variants: [
        {
          sku: defaultVariantSKU,
          name: `${newProdName} (Variante Standard)`,
          price: 150,
          cost: 65,
          stock: { "WH-CENTRAL": 10, "WH-SUR": 2, "WH-MAQUILA": 0 },
          expiringDate: "2029-06-30"
        }
      ]
    };

    setProducts(prev => [...prev, newProductObj]);
    setSelectedProductSKU(newProductObj.sku);
    onAddAudit("PRODUCTOS", "CREACIÓN COMPLETA", `Se registró producto raíz ${newProductObj.sku} de categoría ${newProdCat}`);
    onLogMessage('ok', `Artículo raíz registrado [${newProductObj.sku}]`);
    
    // reset form
    setNewProdName('');
    setNewProdSKU('');
    setShowAddProduct(false);
  };

  // Handler: Add custom variant to active product
  const handleAddVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantSKU.trim() || !variantName.trim()) return;

    if (!selectedProduct) {
      onLogMessage('err', 'Selecciona primero un producto para asociar la variante.');
      return;
    }

    // Validate SKU
    let collision = false;
    products.forEach(p => {
      p.variants.forEach(v => {
        if (v.sku === variantSKU.toUpperCase()) collision = true;
      });
    });

    if (collision) {
      onLogMessage('err', "Fallo: El SKU de la variante ya existe.");
      return;
    }

    const newVariant = {
      sku: variantSKU.toUpperCase(),
      name: variantName,
      price: variantPrice,
      cost: variantCost,
      stock: { "WH-CENTRAL": initialCentralStock, "WH-SUR": 0, "WH-MAQUILA": 0 }
    };

    setProducts(prev => prev.map(p => {
      if (p.sku === selectedProduct.sku) {
        return {
          ...p,
          variants: [...p.variants, newVariant]
        };
      }
      return p;
    }));

    onAddAudit("PRODUCTOS", "CREACIÓN VARIANTE", `SKU variante ${newVariant.sku} agregada al producto raíz ${selectedProduct.sku}`);
    onLogMessage('ok', `Variante agregada con éxito [${newVariant.sku}]`);
    
    // Reset state
    setVariantSKU('');
    setVariantName('');
  };

  // Handler: Transfer Inventory Stock between Warehouses
  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferSKU) return;
    if (transferFromWH === transferToWH) {
      onLogMessage('err', 'La bodega de origen debe ser distinta a la bodega destino.');
      return;
    }
    if (transferQty <= 0) return;

    let success = false;
    let availableInOrigin = 0;

    const updatedProducts = products.map(p => {
      const updatedVariants = p.variants.map(v => {
        if (v.sku === transferSKU) {
          const currentOriginStock = v.stock[transferFromWH] || 0;
          if (currentOriginStock >= transferQty) {
            success = true;
            availableInOrigin = currentOriginStock;
            return {
              ...v,
              stock: {
                ...v.stock,
                [transferFromWH]: currentOriginStock - transferQty,
                [transferToWH]: (v.stock[transferToWH] || 0) + transferQty
              }
            };
          }
        }
        return v;
      });
      return { ...p, variants: updatedVariants };
    });

    if (success) {
      setProducts(updatedProducts);
      onAddAudit("TRANSFERENCIA", "STOCK TRANSFER", `Traslado de ${transferQty} unidad(es) de ${transferSKU} desde ${transferFromWH} a ${transferToWH}`);
      onLogMessage('ok', `Transferencia inventario SOTA completada: ${transferQty}x ${transferSKU}`);
    } else {
      onLogMessage('err', `Error logístico: Stock insuficiente de ${transferSKU} en origen. Disponible: ${availableInOrigin}`);
    }
  };

  // Handler: Emit Purchase Order (Orden de Compra)
  const handleGeneratePurchaseOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderSKU) {
      onLogMessage('err', "Por favor seleccione un artículo para emitir la orden.");
      return;
    }

    const newPO: PurchaseOrder = {
      id: `PO-${new Date().getFullYear()}-00${purchaseOrders.length + 1}`,
      orderNumber: `OC-${Math.floor(Math.random() * 8999 + 1000)}`,
      providerName: orderProvider,
      createdAt: new Date().toISOString().substring(0, 10),
      status: 'generada',
      items: [
        { sku: orderSKU, qty: orderQty, cost: orderCostItem }
      ]
    };

    setPurchaseOrders(prev => [newPO, ...prev]);
    onAddAudit("COMPRAS", "GENERACIÓN OC", `Emisión de la orden ${newPO.orderNumber} para ${orderProvider}`);
    onLogMessage('ok', `Ficha de Orden de Compra generada: ${newPO.orderNumber}`);
  };

  // Handler: Change purchase order status (Receiving Cargo)
  const handleReceiveOrderStock = (poId: string) => {
    let targetPO = purchaseOrders.find(po => po.id === poId);
    if (!targetPO || targetPO.status === 'recibida') return;

    // Receive stocks inside WH-CENTRAL warehouse
    const itemsToReceive = targetPO.items;
    const updatedProducts = products.map(p => {
      const updatedVariants = p.variants.map(v => {
        const matchingItem = itemsToReceive.find(item => item.sku === v.sku);
        if (matchingItem) {
          const currentCentralStock = v.stock["WH-CENTRAL"] || 0;
          return {
            ...v,
            stock: {
              ...v.stock,
              "WH-CENTRAL": currentCentralStock + matchingItem.qty
            }
          };
        }
        return v;
      });
      return { ...p, variants: updatedVariants };
    });

    setProducts(updatedProducts);
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === poId) return { ...po, status: 'recibida' };
      return po;
    }));

    onAddAudit("COMPRAS", "RECEPCIÓN FÍSICA", `Sincronizada recepción de OC ${targetPO.orderNumber}. Stock ingresado en Bodega Central.`);
    onLogMessage('ok', `Recepción completada. Stock sumado en Central.`);
  };

  return (
    <div id="operations-container" className="flex-1 p-6 md:p-8 overflow-y-auto z-10 custom-scrollbar select-none text-on-surface">
      
      {/* SECCIÓN MÉTODOS DE CONTROL / MENÚ SECUNDARIO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-graphite/40 pb-5 mb-6">
        <div>
          <h1 className="text-sm font-mono font-bold tracking-widest text-[#C6FF3D] uppercase flex items-center gap-2">
            <Boxes className="w-5 h-5 text-signal-lime animate-pulse" />
            OPERACIONES INDUSTRIALES DE CADENA DE SUMINISTRO // SOTA v1
          </h1>
          <p className="text-[10px] text-slate mt-1 uppercase">
            Administración matricial de productos, variantes, cotizaciones logísticas y transferencias entre bodegas.
          </p>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex gap-1 bg-carbon/50 border border-graphite/40 p-1.5 rounded-lg">
          {[
            { id: 'products', label: 'Productos & Variantes', icon: Boxes },
            { id: 'providers', label: 'Comparativa Proveedores', icon: Truck },
            { id: 'orders', label: 'Órdenes de Compra', icon: ShoppingCart },
            { id: 'transfers', label: 'Transferencias Bodegas', icon: ArrowRightLeft }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id as any);
                  onLogMessage('info', `Selección logística: ${tab.label.toUpperCase()}`);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                  active 
                    ? 'bg-signal-lime text-void' 
                    : 'text-ash hover:text-bone hover:bg-carbon'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA CENTRAL PRINCIPAL DETALLADA */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* SUB-PÁGINA 1: PRODUCTOS & SKU VARIANTES */}
          {activeSubTab === 'products' && (
            <div className="flex flex-col gap-6">
              
              {/* Product Selector Bar */}
              <div className="bg-carbon/25 border border-graphite/45 backdrop-blur-md rounded-xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <Boxes className="w-5 h-5 text-signal-lime" />
                    <div>
                      <span className="text-[9px] font-mono text-slate block uppercase">Artículo Raíz Activo</span>
                      <select
                        value={selectedProductSKU}
                        onChange={(e) => setSelectedProductSKU(e.target.value)}
                        className="bg-[#04060A] border border-graphite text-xs p-1.5 px-2 text-bone rounded font-bold outline-none uppercase focus:border-signal-lime"
                      >
                        {products.map(p => (
                          <option key={p.sku} value={p.sku}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowAddProduct(!showAddProduct)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-signal-lime/20 to-[#AFFF00]/10 text-signal-lime border border-[#C6FF3D]/30 hover:border-signal-lime text-[10px] font-mono font-bold uppercase rounded-lg transition-all"
                  >
                    + Nuevo Producto Base
                  </button>
                </div>

                {/* Add Product form nested */}
                {showAddProduct && (
                  <form onSubmit={handleCreateProduct} className="border-t border-graphite/45 pt-4 flex flex-col gap-3">
                    <span className="font-mono text-[9px] text-signal-lime uppercase">Alta de Ficha Técnica Base</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-mono text-slate uppercase">Nombre Producto</label>
                        <input 
                          type="text" 
                          placeholder="Microchip Core A"
                          value={newProdName}
                          onChange={(e) => setNewProdName(e.target.value)}
                          className="bg-void border border-graphite text-xs p-2 text-bone outline-none rounded focus:border-signal-lime"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-mono text-slate uppercase">SKU Raíz (Código Único)</label>
                        <input 
                          type="text" 
                          placeholder="SKU-CHIP-V2"
                          value={newProdSKU}
                          onChange={(e) => setNewProdSKU(e.target.value)}
                          className="bg-void border border-graphite text-xs p-2 text-bone outline-none rounded uppercase focus:border-signal-lime font-mono"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-mono text-slate uppercase">Categoría</label>
                        <select
                          value={newProdCat}
                          onChange={(e) => setNewProdCat(e.target.value)}
                          className="bg-void border border-graphite text-xs p-2 text-bone outline-none rounded"
                        >
                          <option value="Hardware">Hardware</option>
                          <option value="Optoelectrónica">Optoelectrónica</option>
                          <option value="Cableado">Cableado</option>
                          <option value="Insumos">Insumos</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end mt-1">
                      <button 
                        type="submit"
                        className="px-4 py-1.5 bg-signal-lime text-void font-bold font-mono text-xs uppercase rounded"
                      >
                        Crear Artículo SOTA
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Grid de Lista de las Variantes Relacionadas */}
              {selectedProduct ? (
                <div className="bg-carbon/25 border border-graphite/45 backdrop-blur-md rounded-xl p-5 flex flex-col gap-4">
                  <div className="border-b border-graphite/30 pb-2 flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-bone">
                        Inventariado de Variantes: {selectedProduct.name}
                      </h3>
                      <span className="text-[9px] text-ash font-mono">Unidades y precios diferenciados de distribución</span>
                    </div>
                    <span className="font-mono text-[9px] text-signal-lime uppercase px-2 py-0.5 border border-signal-lime/25 bg-signal-lime/5 rounded">
                      SKU Raíz: {selectedProduct.sku}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedProduct.variants.map((v) => (
                      <div key={v.sku} className="p-4 border border-graphite/40 bg-void/50 rounded-xl flex flex-col gap-3 relative">
                        <div>
                          <span className="text-[9px] font-mono font-bold text-signal-cyan block">{v.sku}</span>
                          <h4 className="text-xs font-bold font-body text-bone leading-tight">{v.name}</h4>
                        </div>

                        {/* Costos, márgenes y precios */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-b border-graphite/20 py-2">
                          <div className="flex flex-col">
                            <span className="text-slate uppercase text-[8px]">Precio de venta:</span>
                            <span className="text-bone font-bold text-glow-cyan font-mono">${v.price.toFixed(2)} USD</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate uppercase text-[8px]">Costo adquisición:</span>
                            <span className="text-bone font-bold text-slate/90 font-mono">${v.cost.toFixed(2)} USD</span>
                          </div>
                        </div>

                        {/* Detalle Bodegas (Multi-Warehouse visualization) */}
                        <div className="flex flex-col gap-1.5 text-[10px]">
                          <span className="text-slate font-mono uppercase text-[8px]">Stock por Bodega:</span>
                          <div className="flex flex-col gap-1">
                            {warehouses.map((wh) => {
                              const qty = v.stock[wh.id] || 0;
                              const isLow = qty <= 5;
                              return (
                                <div key={wh.id} className="flex justify-between items-center px-2 py-1 bg-carbon/50 rounded border border-graphite/35">
                                  <span className="text-[#8e98b0] text-[9.5px] truncate font-body">{wh.name}</span>
                                  <span className={`font-bold font-mono px-1.5 py-0.5 rounded ${isLow ? 'text-signal-magenta bg-signal-magenta/5 border border-signal-magenta/15 animate-pulse' : 'text-signal-lime'}`}>
                                    {qty} U
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Expiration warning banner if eligible */}
                        {v.expiringDate && (
                          <div className="text-[8.5px] font-mono uppercase flex items-center gap-1 mt-1 text-signal-amber bg-signal-amber/5 border border-signal-amber/15 p-1 rounded">
                            <AlertCircle className="w-3 h-3 text-signal-amber" />
                            Shelf-life expiration target: {v.expiringDate}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* FORMULARIO AGREGAR NUEVA VARIANTE */}
                  <form onSubmit={handleAddVariant} className="border-t border-graphite/40 pt-4 mt-2 flex flex-col gap-3 bg-void/35 p-4 rounded-xl border border-graphite/30">
                    <span className="font-mono text-[9.5px] font-bold text-signal-cyan uppercase flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5" /> Agregar Variante de Producto Especializada
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-mono text-slate uppercase">SKU Variante (Ej: AURA-CORE-BLACK)</label>
                        <input 
                          type="text" 
                          placeholder="AURA-CORE-GLOSS"
                          value={variantSKU}
                          onChange={(e) => setVariantSKU(e.target.value)}
                          className="bg-[#04060A] border border-graphite p-2 text-xs text-bone outline-none rounded font-mono uppercase"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-mono text-slate uppercase">Nombre Variante (Ej: Aura Core Gloss Finish)</label>
                        <input 
                          type="text" 
                          placeholder="Aura Core Black Piano Finish"
                          value={variantName}
                          onChange={(e) => { setNewProdName(preset => preset); setVariantName(e.target.value); }}
                          className="bg-[#04060A] border border-graphite p-2 text-xs text-bone outline-none rounded"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-mono text-slate uppercase">Precio venta ($)</label>
                        <input 
                          type="number" 
                          value={variantPrice}
                          onChange={(e) => setVariantPrice(Number(e.target.value))}
                          className="bg-[#04060A] border border-graphite p-2 text-xs text-bone font-mono"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-mono text-slate uppercase">Costo Adquisición ($)</label>
                        <input 
                          type="number" 
                          value={variantCost}
                          onChange={(e) => setVariantCost(Number(e.target.value))}
                          className="bg-[#04060A] border border-graphite p-2 text-xs text-bone font-mono"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-mono text-slate uppercase">Stock Inicial (B.Central)</label>
                        <input 
                          type="number" 
                          value={initialCentralStock}
                          onChange={(e) => setInitialCentralStock(Number(e.target.value))}
                          className="bg-[#04060A] border border-graphite p-2 text-xs text-bone font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end mt-1">
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-signal-cyan text-void text-xs font-mono font-bold uppercase rounded"
                      >
                        Vincular SKU Variante
                      </button>
                    </div>
                  </form>
                </div>
              ) : null}
            </div>
          )}

          {/* SUB-PÁGINA 2: COMPARATIVA DE PROVEEDORES */}
          {activeSubTab === 'providers' && (
            <div className="bg-carbon/25 border border-graphite/45 backdrop-blur-md rounded-xl p-5 flex flex-col gap-5">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-bone flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-signal-lime" />
                  Comparativa de Costos vs Tiempos de Entrega
                </h3>
                <span className="text-[9px] text-ash font-mono block mt-1">
                  Mapeo analítico logístico para optimización del ROI de reabastecimiento crítico.
                </span>
              </div>

              {/* Comparative Charts Visuals in raw html & css bar chart format */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Cost Comparison */}
                <div className="border border-graphite/45 bg-[#04060A]/50 p-4 rounded-xl flex flex-col gap-4">
                  <span className="font-mono text-[9px] uppercase text-signal-cyan font-bold block">COSTO DE EMBARQUE BASE (USD/FLETE)</span>
                  <div className="flex flex-col gap-3 mt-1 text-[10px] font-mono">
                    {providers.map((p) => {
                      const maxCost = 5000;
                      const percentage = Math.min(100, (p.cost / maxCost) * 100);
                      return (
                        <div key={p.providerName} className="flex flex-col gap-1">
                          <div className="flex justify-between text-bone">
                            <span>{p.providerName}</span>
                            <span className="font-bold text-[#E2E6F2]">${p.cost.toFixed(2)}</span>
                          </div>
                          <div className="w-full h-2.5 bg-[#131826] rounded border border-graphite/40 relative overflow-hidden">
                            <div 
                              className="h-full bg-signal-cyan rounded-sm transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Delivery Time Comparison */}
                <div className="border border-graphite/45 bg-[#04060A]/50 p-4 rounded-xl flex flex-col gap-4">
                  <span className="font-mono text-[9px] uppercase text-signal-lime font-bold block">TIEMPOS DE TRÁNSITO INTERNACIONAL (DÍAS DE ENTREGA)</span>
                  <div className="flex flex-col gap-3 mt-1 text-[10px] font-mono">
                    {providers.map((p) => {
                      const maxDays = 20;
                      const percentage = Math.min(100, (p.deliveryDays / maxDays) * 100);
                      const isOptimal = p.deliveryDays <= 5;
                      return (
                        <div key={p.providerName} className="flex flex-col gap-1">
                          <div className="flex justify-between text-bone">
                            <span>{p.providerName}</span>
                            <span className={`font-bold ${isOptimal ? 'text-signal-lime text-glow-lime' : 'text-ash'}`}>
                              {p.deliveryDays} Días
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-[#131826] rounded border border-graphite/40 relative overflow-hidden">
                            <div 
                              className={`h-full rounded-sm transition-all duration-500 ${isOptimal ? 'bg-signal-lime' : 'bg-signal-amber'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Best provider assessment */}
              <div className="p-4 border border-signal-lime/20 bg-signal-lime/5 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-signal-lime flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-bone text-xs font-mono uppercase">Recomendador SOTA Logístico</h4>
                  <p className="text-[11px] text-[#A6AFC9] leading-relaxed mt-1">
                    Basado en un puntaje ponderado de confiabilidad, costos de embarque y tiempos de flete, <strong className="text-signal-lime">Logística Europea Express</strong> resulta el proveedor óptimo ante tránsitos urgentes (4 días, 98% confiabilidad), mientras que <strong className="text-signal-cyan">Asiátia Optronics Corp</strong> ofrece el mejor retorno económico en compras a volumen masivo programado.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SUB-PÁGINA 3: ÓRDENES DE COMPRA (GENERACIÓN, SEGUIDO, RECEPCIÓN) */}
          {activeSubTab === 'orders' && (
            <div className="flex flex-col gap-6">
              
              {/* Formulario de Generación */}
              <div className="bg-carbon/25 border border-graphite/45 backdrop-blur-md rounded-xl p-5 flex flex-col gap-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-bone flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-signal-cyan" />
                  Emitir Nueva Ficha de Órden de Compra
                </h3>

                <form onSubmit={handleGeneratePurchaseOrder} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-slate uppercase">Proveedor Destino</label>
                    <select
                      value={orderProvider}
                      onChange={(e) => setOrderProvider(e.target.value)}
                      className="bg-void border border-graphite text-xs p-2 text-bone outline-none rounded"
                    >
                      {providers.map(p => (
                        <option key={p.providerName} value={p.providerName}>{p.providerName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-slate uppercase">SKU a Adquirir</label>
                    <select
                      value={orderSKU}
                      onChange={(e) => setOrderSKU(e.target.value)}
                      className="bg-void border border-graphite text-xs p-2 text-bone outline-none rounded font-mono uppercase"
                    >
                      <option value="">Seleccionar SKU</option>
                      {products.map(p => 
                        p.variants.map(v => (
                          <option key={v.sku} value={v.sku}>{v.sku}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-slate uppercase font-semibold">Cantidad Unidades</label>
                    <input 
                      type="number" 
                      value={orderQty}
                      onChange={(e) => setOrderQty(Math.max(1, Number(e.target.value)))}
                      className="bg-void border border-graphite text-xs p-2 text-bone outline-none rounded font-mono"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-slate uppercase">Costo Unitario ($)</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={orderCostItem}
                        onChange={(e) => setOrderCostItem(Math.max(1, Number(e.target.value)))}
                        className="flex-1 bg-void border border-graphite text-xs p-2 text-bone outline-none rounded font-mono"
                        required
                      />
                      <button
                        type="submit"
                        className="bg-signal-cyan text-void font-bold px-3 font-mono text-[10px] uppercase rounded"
                      >
                        Emitir
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Listado de Órdenes creadas con flujo de recepción */}
              <div className="bg-carbon/25 border border-graphite/45 backdrop-blur-md rounded-xl p-5 flex flex-col gap-4">
                <span className="font-mono text-[10px] uppercase text-ash font-semibold block">Seguimiento de Órdenes y Recepción Directa</span>
                
                <div className="flex flex-col gap-3">
                  {purchaseOrders.map((po) => {
                    const isCompleted = po.status === 'recibida';
                    const orderTotal = po.items.reduce((acc, item) => acc + (item.qty * item.cost), 0);
                    
                    return (
                      <div 
                        key={po.id}
                        className={`p-4 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                          isCompleted 
                            ? 'border-graphite/35 bg-void/35 opacity-70' 
                            : 'border-signal-cyan/20 bg-carbon/40'
                        }`}
                      >
                        <div className="flex-1 flex flex-col gap-1 text-[11px] font-mono">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-bone">{po.orderNumber}</span>
                            <span className="text-[#5A6380]">|</span>
                            <span className="text-slate">{po.createdAt}</span>
                            <span className={`text-[8.5px] uppercase font-bold px-1.5 py-0.5 border rounded ${
                              po.status === 'recibida' 
                                ? 'text-signal-lime border-signal-lime/20 bg-signal-lime/5' 
                                : 'text-signal-amber border-signal-amber/20 bg-signal-amber/5'
                            }`}>
                              {po.status}
                            </span>
                          </div>
                          <div className="text-[#8E99B3] mt-1 font-body">
                            Proveedor: <strong className="text-bone">{po.providerName}</strong>
                          </div>
                          
                          {po.items.map((it, idx) => (
                            <div key={idx} className="text-[10px] text-slate font-mono bg-void/50 p-1.5 px-2.5 rounded border border-graphite/40 mt-1.5 max-w-sm flex justify-between">
                              <span>Adquiriendo: {it.sku}</span>
                              <span className="text-bone font-bold">{it.qty} unidades a ${it.cost}/u</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col items-end gap-2.5">
                          <div className="text-[11.5px] font-mono font-bold text-glow-cyan text-bone">
                            Total: ${orderTotal.toFixed(2)} USD
                          </div>

                          {!isCompleted && (
                            <button
                              onClick={() => handleReceiveOrderStock(po.id)}
                              className="px-3 py-1 bg-signal-lime hover:bg-signal-lime/90 text-void font-bold font-mono text-[9.5px] uppercase rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Registrar Recepción (Ingresar Stock)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* SUB-PÁGINA 4: TRANSFERENCIA ENTRE ALMACENES */}
          {activeSubTab === 'transfers' && (
            <div className="bg-carbon/25 border border-graphite/45 backdrop-blur-md rounded-xl p-5 flex flex-col gap-4">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-bone flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-signal-lime" />
                  Módulo de Transferencias de Inventario Inter-Ubicaciones
                </h3>
                <span className="text-[9px] text-ash font-mono block mt-1">
                  Mueve stock seguro desde tu Almacén Central a cualquier sucursal con validaciones integradas de cubicaciones.
                </span>
              </div>

              <form onSubmit={handleExecuteTransfer} className="bg-void/45 p-5 border border-graphite/45 rounded-xl flex flex-col gap-4 mt-1">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[9.5px] font-mono text-slate uppercase">Origen (Desde)</label>
                    <select
                      value={transferFromWH}
                      onChange={(e) => setTransferFromWH(e.target.value)}
                      className="bg-[#04060A] border border-graphite text-xs p-2 text-bone outline-none rounded"
                    >
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9.5px] font-mono text-slate uppercase">Destino (Hacia)</label>
                    <select
                      value={transferToWH}
                      onChange={(e) => setTransferToWH(e.target.value)}
                      className="bg-[#04060A] border border-graphite text-xs p-2 text-bone outline-none rounded"
                    >
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9.5px] font-mono text-slate uppercase">SKU Variante a Mover</label>
                    <select
                      value={transferSKU}
                      onChange={(e) => setTransferSKU(e.target.value)}
                      className="bg-[#04060A] border border-graphite text-xs p-2 text-bone outline-none rounded font-mono uppercase"
                      required
                    >
                      <option value="">Seleccionar SKU</option>
                      {products.map(p => 
                        p.variants.map(v => (
                          <option key={v.sku} value={v.sku}>{v.sku} (Central Stock: {v.stock["WH-CENTRAL"] || 0})</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9.5px] font-mono text-slate uppercase font-semibold">Cantidad a trasladar</label>
                    <input 
                      type="number" 
                      value={transferQty}
                      onChange={(e) => setTransferQty(Math.max(1, Number(e.target.value)))}
                      className="bg-[#04060A] border border-graphite text-xs p-2 text-bone outline-none rounded font-mono"
                      required
                    />
                  </div>

                </div>

                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#C6FF3D] hover:bg-opacity-90 text-void font-bold font-mono text-xs uppercase tracking-wider rounded-lg select-pointer transition-all"
                  >
                    Confirmar Traslado Inmediato
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* COLUMNA LATERAL: PANEL DE ALARMAS AUTOMÁTICAS (BODECORES) */}
        <aside className="flex flex-col gap-6">
          
          {/* SECCIÓN ALERTAS DE STOCK BAJO / PRODUCTOS POR VENCER */}
          <div className="bg-carbon/25 border border-graphite/45 backdrop-blur-md rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-glow-magenta text-signal-magenta flex items-center gap-2">
              <Bell className="w-4 h-4 text-signal-magenta animate-pulse" />
              Notificaciones Inteligentes SOTA
            </h3>

            {/* Low stock indicators */}
            <div className="flex flex-col gap-2.5">
              <span className="font-mono text-[9px] uppercase text-slate block border-b border-graphite/30 pb-1">ALERTAS DE STOCK CRÍTICO (BAJO)</span>
              {lowStockAlerts.length === 0 ? (
                <div className="text-[10px] font-mono text-slate p-2 bg-[#131826]/10 text-center rounded border border-dashed border-graphite">
                  No hay productos con stock deficiente.
                </div>
              ) : (
                lowStockAlerts.map((alert, idx) => (
                  <div key={idx} className="p-3 border border-signal-magenta/10 bg-signal-magenta/5 rounded-lg flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-signal-magenta flex-shrink-0 mt-0.5 animate-pulse" />
                    <div className="text-[10.5px] font-mono leading-tight">
                      <strong className="text-bone">{alert.sku}</strong>
                      <p className="text-[9.5px] text-[#A2AEC8] leading-tight font-body mt-0.5">{alert.variantName}</p>
                      <div className="flex justify-between items-center mt-1 text-[8.5px]">
                        <span className="text-slate uppercase">Ubicación: {alert.location}</span>
                        <span className="text-signal-magenta font-bold font-mono uppercase bg-signal-magenta/10 px-1 py-0.2 rounded">Quedan {alert.stock}U</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Expiring items */}
            <div className="flex flex-col gap-2.5 mt-2">
              <span className="font-mono text-[9px] uppercase text-slate block border-b border-graphite/30 pb-1">PRODUCTOS POR VENCER (OBSOLESCENCIA)</span>
              {expirationAlerts.map((exp, idx) => (
                <div key={idx} className="p-3 border border-signal-amber/10 bg-signal-amber/5 rounded-lg flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-signal-amber flex-shrink-0 mt-0.5" />
                  <div className="text-[10.5px] font-mono leading-tight">
                    <strong className="text-bone">{exp.sku}</strong>
                    <p className="text-[9.5px] text-[#A2AEC8] leading-tight font-body mt-0.5">{exp.variantName}</p>
                    <span className="bg-signal-amber/10 text-signal-amber text-[8.5px] px-1 py-0.2 rounded font-mono font-bold inline-block mt-1">
                      Expira: {exp.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MATRIZ DE ALMACENES UBICADOS */}
          <div className="bg-carbon/25 border border-graphite/45 backdrop-blur-md rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#ECEEF5] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate" />
              Directorio de Sucursales / Almacenes
            </h3>

            <div className="flex flex-col gap-3">
              {warehouses.map((wh) => (
                <div key={wh.id} className="p-3 bg-void/50 border border-graphite/40 rounded-lg flex flex-col gap-1 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-bone">{wh.name}</span>
                    <span className="text-[8.5px] font-mono text-signal-cyan uppercase font-bold bg-[#00F0FF]/10 p-0.5 px-1.5 rounded">{wh.id}</span>
                  </div>
                  <p className="text-ash font-body text-[10px] leading-relaxed">
                    Dirección: {wh.location}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
}
