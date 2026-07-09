'use client'
import { useState, useEffect } from 'react'

const NARANJA = '#E8581A'
const NEGRO = '#111111'
const GRIS = '#6B6862'
const VERDE = '#1E7B34'
const ROJO = '#B0261A'
const AMBER = '#B36B00'
const AZUL = '#1D4E89'
const BORDE = '#E3E0DA'

const fmtPEN = n => n == null ? '—' : 'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })
const fmtDateTime = d => new Date(d).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const UNIDADES = ['und', 'm', 'cm', 'mm', 'kg', 'servicio']
const FORMAS_PAGO = { pos: 'POS / Tarjeta', yape: 'Yape', plin: 'Plin', efectivo: 'Efectivo', transferencia: 'Transferencia' }
const ESTADO_LABELS = { registrado: 'Registrado', anulada: 'Anulada', convertida: 'Convertida a venta' }
const ESTADO_COLORS = { registrado: AZUL, anulada: ROJO, convertida: VERDE }

const inputStyle = { width: '100%', fontFamily: 'Arial', fontSize: 13.5, padding: '9px 12px', border: `1px solid ${BORDE}`, borderRadius: 7, boxSizing: 'border-box' }

export default function Cotizaciones({ session, productos, onRefreshVentas }) {
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [creando, setCreando] = useState(false)
  const [convirtiendo, setConvirtiendo] = useState(null)
  const [formaPagoConvertir, setFormaPagoConvertir] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { cargar() }, [])
  async function cargar() {
    setLoading(true)
    const data = await fetch('/api/cotizaciones').then(r => r.json())
    setCotizaciones(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function anular(id) {
    if (!confirm('¿Anular esta cotización? Quedará registrada con estado Anulada.')) return
    await fetch('/api/cotizaciones', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado: 'anulada' }),
    })
    cargar()
  }

  async function confirmarConversion() {
    if (!formaPagoConvertir) { alert('Selecciona la forma de pago'); return }
    setSaving(true)
    const res = await fetch('/api/cotizaciones/convertir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cotizacion_id: convirtiendo, forma_pago: formaPagoConvertir }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { alert(data.error || 'No se pudo generar la venta'); return }
    setConvirtiendo(null)
    setFormaPagoConvertir('')
    alert(`Venta ${data.numero_comprobante} generada a partir de la cotización.`)
    cargar()
    onRefreshVentas && onRefreshVentas()
  }

  return (
    <div>
      <Panel>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDE}`, display: 'flex', justifyContent: 'flex-end' }}>
          <BtnSmall onClick={() => setCreando(true)}>+ Nueva cotización</BtnSmall>
        </div>
        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: GRIS }}>Cargando...</div>
        ) : cotizaciones.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: GRIS }}>Aún no hay cotizaciones registradas</div>
        ) : (
          <div style={{ maxHeight: 560, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#F7F6F4' }}>
                {['Número', 'Fecha', 'Cliente', 'Estado', 'Total', ''].map(h => <Th key={h}>{h}</Th>)}
              </tr></thead>
              <tbody>
                {cotizaciones.map(c => (
                  <tr key={c.id}>
                    <Td><strong>{c.numero}</strong></Td>
                    <Td>{fmtDateTime(c.fecha)}</Td>
                    <Td>{c.clientes?.nombre || <span style={{ color: '#aaa' }}>Sin registrar</span>}</Td>
                    <Td><Badge color={ESTADO_COLORS[c.estado] || GRIS}>{ESTADO_LABELS[c.estado] || c.estado}</Badge></Td>
                    <Td right><strong>{fmtPEN(c.total_pen)}</strong></Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <span onClick={() => window.open(`/comprobante?tipo=cotizacion&id=${c.id}`, '_blank')} style={{ cursor: 'pointer', color: '#1D4E89', fontSize: 11.5, fontWeight: 'bold' }}>Descargar</span>
                        {c.estado === 'registrado' && (
                          <>
                            <span onClick={() => { setConvirtiendo(c.id); setFormaPagoConvertir('') }} style={{ cursor: 'pointer', color: VERDE, fontSize: 11.5, fontWeight: 'bold' }}>Generar venta</span>
                            <span onClick={() => anular(c.id)} style={{ cursor: 'pointer', color: ROJO, fontSize: 11.5, fontWeight: 'bold' }}>Anular</span>
                          </>
                        )}
                        {c.estado === 'convertida' && <span style={{ fontSize: 11, color: GRIS }}>Ya generó venta</span>}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {creando && (
        <NuevaCotizacionModal
          productos={productos}
          session={session}
          onClose={() => setCreando(false)}
          onCreated={() => { setCreando(false); cargar() }}
        />
      )}

      {convirtiendo && (
        <Modal title="Generar venta desde cotización" onClose={() => setConvirtiendo(null)}>
          <p style={{ fontSize: 13, color: GRIS, marginTop: 0 }}>
            Esto va a crear una venta con los mismos productos de la cotización y descontar el stock correspondiente.
          </p>
          <Campo label="Forma de pago">
            <select style={inputStyle} value={formaPagoConvertir} onChange={e => setFormaPagoConvertir(e.target.value)}>
              <option value="">Selecciona cómo pagó el cliente...</option>
              {Object.entries(FORMAS_PAGO).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </Campo>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <BtnSecondary onClick={() => setConvirtiendo(null)}>Cancelar</BtnSecondary>
            <Btn onClick={confirmarConversion} disabled={saving || !formaPagoConvertir}>{saving ? 'Generando...' : 'Generar venta'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

function NuevaCotizacionModal({ productos, session, onClose, onCreated }) {
  const [cliente, setCliente] = useState({ nombre: '', ruc: '', telefono: '' })
  const [items, setItems] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [itemLibre, setItemLibre] = useState({ descripcion: '', cantidad: '', unidad: 'und', precio_unit: '' })
  const [saving, setSaving] = useState(false)

  const sugeridos = busqueda.length > 0
    ? productos.filter(p => p.descripcion.toLowerCase().includes(busqueda.toLowerCase())).slice(0, 6)
    : []

  function agregarProducto(p) {
    setItems([...items, {
      producto_id: p.id,
      descripcion: p.descripcion,
      cantidad: 1,
      unidad: p.categorias?.unidad_venta || 'und',
      precio_unit: p.precio_venta_pen || p.precio_puesto_depo || 0,
    }])
    setBusqueda('')
  }

  function agregarLibre() {
    if (!itemLibre.descripcion || !itemLibre.cantidad || !itemLibre.precio_unit) {
      alert('Completa descripción, cantidad y precio del ítem')
      return
    }
    setItems([...items, { producto_id: null, ...itemLibre, cantidad: parseFloat(itemLibre.cantidad), precio_unit: parseFloat(itemLibre.precio_unit) }])
    setItemLibre({ descripcion: '', cantidad: '', unidad: 'und', precio_unit: '' })
  }

  function quitarItem(idx) {
    setItems(items.filter((_, i) => i !== idx))
  }

  const total = items.reduce((s, i) => s + i.cantidad * i.precio_unit, 0)

  async function guardar() {
    if (items.length === 0) { alert('Agrega al menos un ítem a la cotización'); return }
    setSaving(true)
    const res = await fetch('/api/cotizaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente: cliente.nombre ? cliente : null,
        items,
        vendedor_id: null,
        sede: session?.user?.sede || 'Trujillo',
        total_pen: total,
      }),
    })
    setSaving(false)
    if (!res.ok) { alert('No se pudo crear la cotización'); return }
    onCreated()
  }

  return (
    <Modal title="Nueva cotización" onClose={onClose}>
      <Campo label="Cliente (nombre)"><input style={inputStyle} value={cliente.nombre} onChange={e => setCliente({ ...cliente, nombre: e.target.value })} placeholder="Nombre del cliente" /></Campo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Campo label="RUC / DNI"><input style={inputStyle} value={cliente.ruc} onChange={e => setCliente({ ...cliente, ruc: e.target.value })} placeholder="RUC o DNI" /></Campo>
        <Campo label="Teléfono"><input style={inputStyle} value={cliente.telefono} onChange={e => setCliente({ ...cliente, telefono: e.target.value })} placeholder="Teléfono" /></Campo>
      </div>

      <div style={{ borderTop: `1px solid ${BORDE}`, marginTop: 10, paddingTop: 14 }}>
        <Campo label="Buscar producto del inventario">
          <input style={inputStyle} value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Escribe para buscar..." />
        </Campo>
        {sugeridos.length > 0 && (
          <div style={{ border: `1px solid ${BORDE}`, borderRadius: 7, marginTop: -8, marginBottom: 14, overflow: 'hidden' }}>
            {sugeridos.map(p => (
              <div key={p.id} onClick={() => agregarProducto(p)} style={{ padding: '8px 12px', fontSize: 12.5, cursor: 'pointer', borderBottom: `1px solid #F1EFEC` }}>
                {p.descripcion} <span style={{ color: GRIS, fontSize: 11 }}>({fmtPEN(p.precio_venta_pen || p.precio_puesto_depo)})</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: '#F7F6F4', borderRadius: 8, padding: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 11.5, fontWeight: 'bold', marginBottom: 8, color: '#3A3835' }}>O agrega un ítem libre (a medida)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8 }}>
            <input style={inputStyle} value={itemLibre.descripcion} onChange={e => setItemLibre({ ...itemLibre, descripcion: e.target.value })} placeholder="Descripción" />
            <input type="number" style={inputStyle} value={itemLibre.cantidad} onChange={e => setItemLibre({ ...itemLibre, cantidad: e.target.value })} placeholder="Cant." />
            <select style={inputStyle} value={itemLibre.unidad} onChange={e => setItemLibre({ ...itemLibre, unidad: e.target.value })}>
              {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <input type="number" style={inputStyle} value={itemLibre.precio_unit} onChange={e => setItemLibre({ ...itemLibre, precio_unit: e.target.value })} placeholder="P.unit S/" />
          </div>
          <div style={{ marginTop: 8 }}><BtnSecondary onClick={agregarLibre}>+ Agregar ítem</BtnSecondary></div>
        </div>
      </div>

      {items.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid #F1EFEC`, fontSize: 13 }}>
              <div>{item.descripcion}<br /><span style={{ color: GRIS, fontSize: 11.5 }}>{item.cantidad} {item.unidad} × {fmtPEN(item.precio_unit)}</span></div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <strong>{fmtPEN(item.cantidad * item.precio_unit)}</strong>
                <span onClick={() => quitarItem(idx)} style={{ color: ROJO, cursor: 'pointer', fontSize: 12 }}>Quitar</span>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontWeight: 'bold', fontSize: 15 }}>
            <span>Total</span><span>{fmtPEN(total)}</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <BtnSecondary onClick={onClose}>Cancelar</BtnSecondary>
        <Btn onClick={guardar} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cotización'}</Btn>
      </div>
    </Modal>
  )
}

// ---- UI mínima local (mismo estilo del sistema) ----
function Panel({ title, children }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDE}`, borderRadius: 8, marginBottom: 22, overflow: 'hidden' }}>
      {title && <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDE}`, fontSize: 14.5, fontWeight: 'bold' }}>{title}</div>}
      {children}
    </div>
  )
}
function Th({ children }) {
  return <th style={{ textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: .4, padding: '9px 14px', borderBottom: `1px solid ${BORDE}`, color: '#6B6862', whiteSpace: 'nowrap' }}>{children}</th>
}
function Td({ children, right }) {
  return <td style={{ padding: '10px 14px', borderBottom: '1px solid #F1EFEC', textAlign: right ? 'right' : 'left' }}>{children}</td>
}
function Badge({ children, color }) {
  return <span style={{ fontSize: 10.5, fontWeight: 'bold', padding: '3px 8px', borderRadius: 5, background: color + '22', color }}>{children}</span>
}
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,17,17,.55)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 10, width: 600, maxWidth: '100%', maxHeight: '88vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: `1px solid ${BORDE}` }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>{title}</h2>
          <span onClick={onClose} style={{ cursor: 'pointer', fontSize: 18, color: GRIS }}>×</span>
        </div>
        <div style={{ padding: '20px 22px' }}>{children}</div>
      </div>
    </div>
  )
}
function Campo({ label, children }) {
  return <div style={{ marginBottom: 14 }}><label style={{ display: 'block', fontSize: 11.5, fontWeight: 'bold', color: '#3A3835', marginBottom: 5 }}>{label}</label>{children}</div>
}
function Btn({ children, onClick, disabled }) {
  return <button onClick={onClick} disabled={disabled} style={{ background: disabled ? '#B8B5AE' : NARANJA, color: '#fff', border: 'none', borderRadius: 6, padding: '11px 16px', fontWeight: 'bold', fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer', flex: 1 }}>{children}</button>
}
function BtnSecondary({ children, onClick }) {
  return <button onClick={onClick} style={{ background: '#fff', color: NEGRO, border: `1px solid ${BORDE}`, borderRadius: 6, padding: '11px 16px', fontSize: 13, cursor: 'pointer', flex: 1 }}>{children}</button>
}
function BtnSmall({ children, onClick }) {
  return <button onClick={onClick} style={{ background: NARANJA, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 12.5, fontWeight: 'bold', cursor: 'pointer' }}>{children}</button>
}
