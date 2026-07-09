'use client'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Cotizaciones from './Cotizaciones'

const NARANJA = '#E8581A'
const NEGRO = '#111111'
const GRIS = '#6B6862'
const VERDE = '#1E7B34'
const ROJO = '#B0261A'
const AMBER = '#B36B00'
const BORDE = '#E3E0DA'

const fmtPEN = n => n == null ? '—' : 'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })
const fmtUSD = n => n == null ? '—' : '$ ' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })
const fmtDate = d => new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
const fmtDateTime = d => new Date(d).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function descargarCSV(filename, headers, rows) {
  const esc = v => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const csv = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const VISTAS = {
  dashboard: 'Resumen general',
  cotizaciones: 'Cotizaciones',
  inventario: 'Inventario',
  pos: 'Ventas / POS',
  historial: 'Historial de ventas',
  trazabilidad: 'Trazabilidad',
  gastos: 'Gastos',
  reportes: 'Reportes',
  usuarios: 'Usuarios y roles',
}

export default function SistemaPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [vistaActual, setVistaActual] = useState('dashboard')
  const [productos, setProductos] = useState([])
  const [ventas, setVentas] = useState([])
  const [gastos, setGastos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [importaciones, setImportaciones] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') cargarDatos()
  }, [status])

  async function cargarDatos() {
    setLoading(true)
    const [prods, ventas_, gastos_, users, imports] = await Promise.all([
      fetch('/api/productos').then(r => r.json()),
      fetch('/api/ventas').then(r => r.json()),
      fetch('/api/gastos').then(r => r.json()),
      fetch('/api/usuarios').then(r => r.json()),
      fetch('/api/importaciones').then(r => r.json()),
    ])
    setProductos(Array.isArray(prods) ? prods : [])
    setVentas(Array.isArray(ventas_) ? ventas_ : [])
    setGastos(Array.isArray(gastos_) ? gastos_ : [])
    setUsuarios(Array.isArray(users) ? users : [])
    setImportaciones(Array.isArray(imports) ? imports : [])
    setLoading(false)
  }

  if (status === 'loading' || loading) {
    return (
      <div style={{ minHeight: '100vh', background: NEGRO, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#fff', fontFamily: 'Arial', fontSize: 16 }}>Cargando sistema...</div>
      </div>
    )
  }

  if (!session) return null

  const isPOS = session.user.rol === 'pos_trujillo'
  const stockBajo = productos.filter(p => p.stock <= (p.stock_minimo || 0))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif', fontSize: 14, color: NEGRO }}>
      {/* SIDEBAR */}
      <div style={{ width: 230, background: NEGRO, color: '#fff', minHeight: '100vh', padding: '22px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px 22px', borderBottom: '1px solid #2A2A2A', marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {[0,1,2].map(i => <span key={i} style={{ display: 'block', width: 4, height: 20, background: NARANJA, borderRadius: 1 }} />)}
          </div>
          <div style={{ fontWeight: 'bold', fontSize: 13, lineHeight: 1.3 }}>
            IGE<br /><small style={{ color: '#999', fontSize: 10, fontWeight: 'normal' }}>Sistema de gestión</small>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' }}>
          {Object.entries(VISTAS).map(([key, label]) => {
            if (isPOS && key !== 'pos') return null
            const active = vistaActual === key
            return (
              <div key={key} onClick={() => setVistaActual(key)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 6, color: active ? '#fff' : '#C9C7C2', cursor: 'pointer',
                background: active ? NARANJA : 'transparent', fontWeight: active ? 'bold' : 'normal',
                fontSize: 13, transition: '.15s'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#fff' : '#555', flexShrink: 0 }} />
                {label}
                {key === 'inventario' && stockBajo.length > 0 && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: ROJO, marginLeft: 'auto' }} />
                )}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 24, padding: '14px 20px', borderTop: '1px solid #2A2A2A' }}>
          <div style={{ fontSize: 12, color: '#999' }}>
            <strong style={{ color: '#fff' }}>{session.user.name}</strong><br />
            {session.user.rol} · {session.user.sede}
          </div>
          <div onClick={() => signOut({ callbackUrl: '/login' })}
            style={{ marginTop: 10, fontSize: 12, color: NARANJA, cursor: 'pointer', fontWeight: 'bold' }}>
            Cerrar sesión
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: '28px 36px', background: '#F7F6F4', maxWidth: 1180 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 22 }}>
          <h1 style={{ fontSize: 20, margin: 0 }}>{VISTAS[vistaActual]}</h1>
          <button onClick={cargarDatos} style={{
            background: '#fff', border: `1px solid ${BORDE}`, borderRadius: 6,
            padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: GRIS
          }}>↻ Actualizar</button>
        </div>

        {vistaActual === 'dashboard' && <Dashboard productos={productos} ventas={ventas} gastos={gastos} importaciones={importaciones} stockBajo={stockBajo} />}
        {vistaActual === 'cotizaciones' && <Cotizaciones session={session} productos={productos} onRefreshVentas={cargarDatos} />}
        {vistaActual === 'inventario' && <Inventario productos={productos} onRefresh={cargarDatos} />}
        {vistaActual === 'pos' && <POS productos={productos} session={session} cart={cart} setCart={setCart} onRefresh={cargarDatos} />}
        {vistaActual === 'historial' && <Historial ventas={ventas} onRefresh={cargarDatos} />}
        {vistaActual === 'trazabilidad' && <Trazabilidad importaciones={importaciones} onRefresh={cargarDatos} />}
        {vistaActual === 'gastos' && <Gastos gastos={gastos} session={session} onRefresh={cargarDatos} />}
        {vistaActual === 'reportes' && <Reportes ventas={ventas} gastos={gastos} />}
        {vistaActual === 'usuarios' && <Usuarios usuarios={usuarios} onRefresh={cargarDatos} />}
      </div>
    </div>
  )
}

// ---- DASHBOARD ----
function Dashboard({ productos, ventas, gastos, importaciones, stockBajo }) {
  const conPrecio = productos.filter(p => p.precio_puesto_depo != null)
  const valorStock = conPrecio.reduce((s, p) => s + (p.precio_puesto_depo * p.stock), 0)
  const lote = importaciones[0]
  const totalImport = lote?.importacion_items?.reduce((s, i) => s + (i.precio_compra_unit_usd * i.cantidad), 0) || 0

  const cats = {}
  productos.forEach(p => {
    const c = p.categorias?.nombre || 'Sin categoría'
    if (!cats[c]) cats[c] = { n: 0, stock: 0, valor: 0, unidad: p.categorias?.unidad_venta || 'und' }
    cats[c].n++
    cats[c].stock += p.stock
    if (p.precio_puesto_depo) cats[c].valor += p.precio_puesto_depo * p.stock
  })

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 26 }}>
        <KPI v={productos.length} l="SKUs en almacén Trujillo" />
        <KPI v={fmtPEN(valorStock)} l="Valor de stock estimado" />
        <KPI v={stockBajo.length} l="SKUs con stock bajo" color={stockBajo.length > 0 ? ROJO : undefined} />
        <KPI v={fmtUSD(totalImport)} l={`Container Australia (${lote?.estado || '—'})`} />
      </div>
      <Panel title="Stock por categoría">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: '#F7F6F4' }}>
            {['Categoría','SKUs','Stock','Valor estimado'].map(h => <Th key={h}>{h}</Th>)}
          </tr></thead>
          <tbody>
            {Object.entries(cats).map(([nombre, c]) => (
              <tr key={nombre}>
                <Td>{nombre}</Td>
                <Td right>{c.n}</Td>
                <Td right>{c.stock.toLocaleString('es-PE')} {c.unidad}</Td>
                <Td right>{c.valor > 0 ? fmtPEN(c.valor) : <Badge color={AMBER}>Pendiente</Badge>}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      {stockBajo.length > 0 && (
        <Notice>
          <strong>Stock bajo:</strong> {stockBajo.map(p => p.descripcion).join(', ')}
        </Notice>
      )}
    </div>
  )
}

// ---- INVENTARIO ----
const UNIDADES_COMUNES = ['und', 'm', 'kg', 'par', 'juego', 'servicio']

function Inventario({ productos, onRefresh }) {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [categorias, setCategorias] = useState([])
  const [creandoCategoria, setCreandoCategoria] = useState(false)
  const [nuevaCatNombre, setNuevaCatNombre] = useState('')
  const [nuevaCatUnidad, setNuevaCatUnidad] = useState('und')
  const [eliminando, setEliminando] = useState(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [errorPass, setErrorPass] = useState('')
  const [borrando, setBorrando] = useState(false)

  useEffect(() => { cargarCategorias() }, [])
  async function cargarCategorias() {
    const data = await fetch('/api/categorias').then(r => r.json())
    if (Array.isArray(data)) setCategorias(data)
  }

  const cats = [...new Set(productos.map(p => p.categorias?.nombre).filter(Boolean))]
  const filtrados = productos.filter(p => {
    const matchSearch = !search || p.descripcion.toLowerCase().includes(search.toLowerCase()) || String(p.codigo_legacy).includes(search)
    const matchCat = !catFilter || p.categorias?.nombre === catFilter
    return matchSearch && matchCat
  })

  function abrirNuevo() {
    setEditando('nuevo')
    setCreandoCategoria(false)
    setNuevaCatNombre('')
    setNuevaCatUnidad('und')
    setForm({ codigo_legacy: '', descripcion: '', categoria_id: categorias[0]?.id || '', stock: '', stock_minimo: '', precio_compra: '', precio_puesto_depo: '', precio_venta_pen: '', activo: true })
  }

  function onChangeCategoria(value) {
    if (value === '__nueva__') {
      setCreandoCategoria(true)
      setForm({ ...form, categoria_id: '' })
    } else {
      setCreandoCategoria(false)
      setForm({ ...form, categoria_id: parseInt(value) })
    }
  }

  const categoriaSeleccionada = categorias.find(c => c.id === form.categoria_id)

  async function guardar() {
    if (editando === 'nuevo' && (!form.descripcion || !form.codigo_legacy)) {
      alert('Completa al menos el código y la descripción')
      return
    }
    if (creandoCategoria && !nuevaCatNombre.trim()) {
      alert('Escribe el nombre de la nueva categoría')
      return
    }
    setSaving(true)

    let payload = { ...form }

    if (creandoCategoria) {
      const nuevaCat = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevaCatNombre.trim(), unidad_venta: nuevaCatUnidad }),
      }).then(r => r.json())
      if (!nuevaCat?.id) {
        setSaving(false)
        alert('No se pudo crear la categoría, intenta de nuevo')
        return
      }
      payload.categoria_id = nuevaCat.id
    }

    const res = await fetch('/api/productos', {
      method: editando === 'nuevo' ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert('No se pudo guardar el producto: ' + (err.error || 'Error desconocido'))
      return
    }
    setEditando(null)
    cargarCategorias()
    onRefresh()
  }

  async function confirmarEliminar() {
    if (!passwordInput) { setErrorPass('Ingresa la contraseña'); return }
    setBorrando(true)
    setErrorPass('')
    const res = await fetch('/api/productos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: eliminando, password: passwordInput }),
    })
    setBorrando(false)
    if (res.status === 401) { setErrorPass('Contraseña incorrecta'); return }
    if (!res.ok) { setErrorPass('No se pudo eliminar, intenta de nuevo'); return }
    setEliminando(null)
    setPasswordInput('')
    onRefresh()
  }

  return (
    <div>
      <Panel>
        <div style={{ display: 'flex', gap: 8, padding: '14px 18px', borderBottom: `1px solid ${BORDE}`, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por código o descripción..."
            style={{ flex: 1, minWidth: 160, fontFamily: 'Arial', fontSize: 12.5, padding: '7px 10px', border: `1px solid ${BORDE}`, borderRadius: 6 }} />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            style={{ fontFamily: 'Arial', fontSize: 12.5, padding: '7px 10px', border: `1px solid ${BORDE}`, borderRadius: 6 }}>
            <option value="">Todas las categorías</option>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <BtnSmall onClick={abrirNuevo}>+ Agregar producto</BtnSmall>
        </div>
        <div style={{ maxHeight: 560, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#F7F6F4' }}>
              {['Código','Descripción','Categoría','Stock','Stock mín.','Precio compra','Puesto en depo','Estado','',''].map(h => <Th key={h}>{h}</Th>)}
            </tr></thead>
            <tbody>
              {filtrados.map(p => {
                const bajo = p.stock <= (p.stock_minimo || 0)
                return (
                  <tr key={p.id}>
                    <Td>{p.codigo_legacy}</Td>
                    <Td>{p.descripcion}</Td>
                    <Td><span style={{ fontSize: 11, color: GRIS }}>{p.categorias?.nombre}</span></Td>
                    <Td right>{p.stock} {p.categorias?.unidad_venta}</Td>
                    <Td right>{p.stock_minimo || 0}</Td>
                    <Td right>{fmtPEN(p.precio_compra)}</Td>
                    <Td right>{fmtPEN(p.precio_puesto_depo)}</Td>
                    <Td>{bajo ? <Badge color={ROJO}>Stock bajo</Badge> : (p.precio_compra ? <Badge color={VERDE}>OK</Badge> : <Badge color={AMBER}>Pendiente</Badge>)}</Td>
                    <Td><span onClick={() => { setEditando(p.id); setForm(p) }} style={{ cursor: 'pointer', color: NARANJA, fontSize: 11.5, fontWeight: 'bold' }}>Editar</span></Td>
                    <Td><span onClick={() => { setEliminando(p.id); setPasswordInput(''); setErrorPass('') }} style={{ cursor: 'pointer', color: ROJO, fontSize: 11.5, fontWeight: 'bold' }}>Eliminar</span></Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {eliminando && (
        <Modal title="Eliminar producto" onClose={() => setEliminando(null)}>
          <p style={{ fontSize: 13, color: GRIS, marginTop: 0 }}>
            Esta acción elimina el producto del inventario de forma permanente. No se puede deshacer.
          </p>
          <Campo label="Contraseña especial">
            <input type="password" style={inputStyle} value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="Contraseña" autoFocus />
          </Campo>
          {errorPass && <div style={{ color: ROJO, fontSize: 12.5, marginTop: -8, marginBottom: 10 }}>{errorPass}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <BtnSecondary onClick={() => setEliminando(null)}>Cancelar</BtnSecondary>
            <Btn onClick={confirmarEliminar} disabled={borrando} style={{ background: ROJO }}>{borrando ? 'Eliminando...' : 'Eliminar definitivamente'}</Btn>
          </div>
        </Modal>
      )}

      {editando && (
        <Modal title={editando === 'nuevo' ? 'Agregar producto' : 'Editar producto'} onClose={() => setEditando(null)}>
          <Campo label="Descripción">
            <input style={inputStyle} placeholder="Ej. Vástago de 60" value={form.descripcion || ''} onChange={e => setForm({...form, descripcion: e.target.value})} />
          </Campo>

          {editando === 'nuevo' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Campo label="Código">
                <input style={inputStyle} placeholder="Ej. 114" value={form.codigo_legacy || ''} onChange={e => setForm({...form, codigo_legacy: e.target.value})} />
              </Campo>
              <Campo label="Categoría">
                <select style={inputStyle} value={creandoCategoria ? '__nueva__' : (form.categoria_id || '')} onChange={e => onChangeCategoria(e.target.value)}>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  <option value="__nueva__">+ Crear nueva categoría...</option>
                </select>
              </Campo>
            </div>
          ) : (
            <Campo label="Categoría"><input style={inputStyle} disabled value={form.categorias?.nombre || ''} /></Campo>
          )}

          {creandoCategoria && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#F7F6F4', borderRadius: 8, padding: 12, marginBottom: 14 }}>
              <Campo label="Nombre de la nueva categoría">
                <input style={inputStyle} placeholder="Ej. Rodamientos" value={nuevaCatNombre} onChange={e => setNuevaCatNombre(e.target.value)} />
              </Campo>
              <Campo label="Unidad de medida">
                <select style={inputStyle} value={nuevaCatUnidad} onChange={e => setNuevaCatUnidad(e.target.value)}>
                  {UNIDADES_COMUNES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </Campo>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Campo label="Stock"><input type="number" style={inputStyle} placeholder="0" value={form.stock || ''} onChange={e => setForm({...form, stock: e.target.value})} /></Campo>
            <Campo label="Unidad">
              <input style={inputStyle} disabled
                value={creandoCategoria ? nuevaCatUnidad : (categoriaSeleccionada?.unidad_venta || form.categorias?.unidad_venta || '')} />
            </Campo>
            <Campo label="Stock mínimo (alerta)">
              <input type="number" style={inputStyle} placeholder="0" value={form.stock_minimo || ''} onChange={e => setForm({...form, stock_minimo: e.target.value})} />
              <div style={{ fontSize: 10.5, color: GRIS, marginTop: 4 }}>El sistema avisa cuando el stock baja de este número</div>
            </Campo>
            <Campo label="Precio compra (S/)"><input type="number" style={inputStyle} placeholder="0.00" value={form.precio_compra || ''} onChange={e => setForm({...form, precio_compra: e.target.value})} /></Campo>
            <Campo label="Puesto en depo (S/)"><input type="number" style={inputStyle} placeholder="0.00" value={form.precio_puesto_depo || ''} onChange={e => setForm({...form, precio_puesto_depo: e.target.value})} /></Campo>
            <Campo label="Precio de venta (S/)"><input type="number" style={inputStyle} placeholder="0.00" value={form.precio_venta_pen || ''} onChange={e => setForm({...form, precio_venta_pen: e.target.value})} /></Campo>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <BtnSecondary onClick={() => setEditando(null)}>Cancelar</BtnSecondary>
            <Btn onClick={guardar} disabled={saving}>{saving ? 'Guardando...' : (editando === 'nuevo' ? 'Guardar producto' : 'Guardar cambios')}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ---- POS ----
function POS({ productos, session, cart, setCart, onRefresh }) {
  const [search, setSearch] = useState('')
  const [cliente, setCliente] = useState({ nombre: '', telefono: '', ruc: '', direccion: '' })
  const [formaPago, setFormaPago] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [saving, setSaving] = useState(false)
  const [ventaGenerada, setVentaGenerada] = useState(null)

  const FORMAS_PAGO = { pos: 'POS / Tarjeta', yape: 'Yape', plin: 'Plin', efectivo: 'Efectivo', transferencia: 'Transferencia' }

  const vendibles = productos.filter(p => (p.precio_venta_pen || p.precio_puesto_depo) && p.stock > 0)
  const filtrados = vendibles.filter(p => !search || p.descripcion.toLowerCase().includes(search.toLowerCase()) || String(p.codigo_legacy).includes(search))

  function addToCart(p) {
    const precio = p.precio_venta_pen || p.precio_puesto_depo
    const existing = cart.find(i => i.id === p.id)
    if (existing) {
      if (existing.cant + 1 > p.stock) { alert('Sin stock suficiente'); return }
      setCart(cart.map(i => i.id === p.id ? {...i, cant: i.cant + 1} : i))
    } else {
      setCart([...cart, { id: p.id, descripcion: p.descripcion, precio, precioOrig: precio, cant: 1, unidad: p.categorias?.unidad_venta || 'und' }])
    }
  }

  const total = cart.reduce((s, i) => s + i.precio * i.cant, 0)

  async function confirmarVenta() {
    setSaving(true)
    const body = {
      cliente: cliente.nombre ? cliente : null,
      items: cart.map(i => ({ producto_id: i.id, cantidad: i.cant, precio: i.precio })),
      vendedor_id: null,
      sede: session.user.sede || 'Trujillo',
      total_pen: total,
      forma_pago: formaPago,
    }
    const res = await fetch('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      alert('No se pudo generar la venta: ' + (data.error || 'Error desconocido'))
      return
    }
    setConfirmando(false)
    setCart([])
    setCliente({ nombre: '', telefono: '', ruc: '', direccion: '' })
    setFormaPago('')
    setVentaGenerada(data)
    onRefresh()
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 18, alignItems: 'start' }}>
      <Panel>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDE}` }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            style={{ width: '100%', fontFamily: 'Arial', fontSize: 12.5, padding: '7px 10px', border: `1px solid ${BORDE}`, borderRadius: 6, boxSizing: 'border-box' }} />
        </div>
        <div style={{ maxHeight: 480, overflow: 'auto' }}>
          {filtrados.map(p => (
            <div key={p.id} onClick={() => addToCart(p)} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 14px', borderBottom: `1px solid #F1EFEC`, cursor: 'pointer'
            }}>
              <div>
                <div style={{ fontSize: 13 }}>{p.descripcion}</div>
                <div style={{ fontSize: 11, color: GRIS }}>Stock: {p.stock} {p.categorias?.unidad_venta}</div>
              </div>
              <div style={{ fontWeight: 'bold', fontSize: 13 }}>{fmtPEN(p.precio_venta_pen || p.precio_puesto_depo)}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Comprobante actual">
        <div style={{ padding: '14px 18px' }}>
          {cart.length === 0
            ? <div style={{ textAlign: 'center', color: GRIS, padding: '30px 10px', fontSize: 12.5 }}>Aún no agregaste productos</div>
            : cart.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid #F1EFEC`, fontSize: 13 }}>
                <div>{item.descripcion}<br /><span style={{ color: GRIS, fontSize: 11.5 }}>{item.cant} {item.unidad} × {fmtPEN(item.precio)}</span></div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <strong>{fmtPEN(item.precio * item.cant)}</strong>
                  <span onClick={() => setCart(cart.filter((_, i) => i !== idx))} style={{ color: ROJO, cursor: 'pointer', fontSize: 12 }}>Quitar</span>
                </div>
              </div>
            ))
          }
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', fontWeight: 'bold', fontSize: 16, borderTop: `2px solid ${NEGRO}`, marginTop: 10 }}>
            <span>Total</span><span>{fmtPEN(total)}</span>
          </div>
          <div style={{ marginTop: 14, borderTop: `1px solid ${BORDE}`, paddingTop: 14 }}>
            <Campo label="Cliente (opcional)"><input style={inputStyle} value={cliente.nombre} onChange={e => setCliente({...cliente, nombre: e.target.value})} placeholder="Nombre" /></Campo>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
              <input style={inputStyle} value={cliente.telefono} onChange={e => setCliente({...cliente, telefono: e.target.value})} placeholder="Teléfono" />
              <input style={inputStyle} value={cliente.ruc} onChange={e => setCliente({...cliente, ruc: e.target.value})} placeholder="RUC" />
            </div>
            <input style={{...inputStyle, marginTop: 8, width: '100%'}} value={cliente.direccion} onChange={e => setCliente({...cliente, direccion: e.target.value})} placeholder="Dirección" />
          </div>
          <Btn onClick={() => setConfirmando(true)} disabled={cart.length === 0} style={{ marginTop: 14 }}>
            Revisar y generar comprobante
          </Btn>
        </div>
      </Panel>

      {confirmando && (
        <Modal title="Confirmar venta" onClose={() => setConfirmando(false)}>
          {cart.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid #F1EFEC`, gap: 12 }}>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 13 }}>{item.descripcion}</strong>
                <div style={{ fontSize: 11.5, color: GRIS }}>{item.cant} {item.unidad}</div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: GRIS, marginBottom: 3 }}>Precio de venta</div>
                <input type="number" value={item.precio} onChange={e => {
                  const nuevo = parseFloat(e.target.value) || 0
                  setCart(cart.map((i, ii) => ii === idx ? {...i, precio: nuevo} : i))
                }} style={{ width: 100, fontFamily: 'Arial', fontSize: 13, padding: '6px 8px', border: `1px solid ${item.precio !== item.precioOrig ? AMBER : BORDE}`, borderRadius: 5, textAlign: 'right' }} />
                {item.precio !== item.precioOrig && <div style={{ fontSize: 10.5, color: '#aaa', textDecoration: 'line-through', textAlign: 'right' }}>{fmtPEN(item.precioOrig)}</div>}
              </div>
            </div>
          ))}
          <div style={{ background: '#F7F6F4', borderRadius: 8, padding: '14px 16px', marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 16 }}>
              <span>Total a cobrar</span><span>{fmtPEN(total)}</span>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <Campo label="Forma de pago">
              <select style={inputStyle} value={formaPago} onChange={e => setFormaPago(e.target.value)}>
                <option value="">Selecciona cómo pagó el cliente...</option>
                {Object.entries(FORMAS_PAGO).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </Campo>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <BtnSecondary onClick={() => setConfirmando(false)}>Seguir editando</BtnSecondary>
            <Btn onClick={confirmarVenta} disabled={saving || !formaPago}>{saving ? 'Procesando...' : 'Confirmar y generar'}</Btn>
          </div>
        </Modal>
      )}

      {ventaGenerada && (
        <Modal title="Venta generada" onClose={() => setVentaGenerada(null)}>
          <p style={{ fontSize: 14 }}>
            Comprobante <strong>{ventaGenerada.numero_comprobante}</strong> generado correctamente. Stock actualizado.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <BtnSecondary onClick={() => window.open(`/comprobante?tipo=venta&id=${ventaGenerada.id}`, '_blank')}>
              Descargar comprobante
            </BtnSecondary>
            <Btn onClick={() => window.open(`/comprobante?tipo=venta&id=${ventaGenerada.id}`, '_blank')}>
              Imprimir comprobante
            </Btn>
          </div>
          <div style={{ marginTop: 12 }}>
            <BtnSecondary onClick={() => setVentaGenerada(null)}>Cerrar</BtnSecondary>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ---- HISTORIAL ----
function Historial({ ventas, onRefresh }) {
  const FORMAS_PAGO = { pos: 'POS / Tarjeta', yape: 'Yape', plin: 'Plin', efectivo: 'Efectivo', transferencia: 'Transferencia' }
  const [eliminando, setEliminando] = useState(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [errorPass, setErrorPass] = useState('')
  const [borrando, setBorrando] = useState(false)

  function exportar() {
    descargarCSV(
      `ventas_${new Date().toISOString().slice(0,10)}.csv`,
      ['Comprobante', 'Fecha', 'Vendedor', 'Cliente', 'Forma de pago', 'Total'],
      ventas.map(v => [
        v.numero_comprobante,
        fmtDateTime(v.fecha),
        v.usuarios?.nombre || '',
        v.clientes?.nombre || '',
        v.forma_pago ? (FORMAS_PAGO[v.forma_pago] || v.forma_pago) : '',
        v.total_pen,
      ])
    )
  }

  async function confirmarEliminar() {
    if (!passwordInput) { setErrorPass('Ingresa la contraseña'); return }
    setBorrando(true)
    setErrorPass('')
    const res = await fetch('/api/ventas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: eliminando, password: passwordInput }),
    })
    setBorrando(false)
    if (res.status === 401) {
      setErrorPass('Contraseña incorrecta')
      return
    }
    if (!res.ok) {
      setErrorPass('No se pudo eliminar, intenta de nuevo')
      return
    }
    setEliminando(null)
    setPasswordInput('')
    onRefresh()
  }

  return (
    <Panel title="Comprobantes generados">
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${BORDE}`, display: 'flex', justifyContent: 'flex-end' }}>
        <BtnSmall onClick={exportar}>⬇ Descargar CSV</BtnSmall>
      </div>
      {ventas.length === 0
        ? <div style={{ padding: 30, textAlign: 'center', color: GRIS }}>Aún no hay ventas registradas</div>
        : <div style={{ maxHeight: 560, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#F7F6F4' }}>
              {['Comprobante','Fecha','Vendedor','Cliente','Forma de pago','Total',''].map(h => <Th key={h}>{h}</Th>)}
            </tr></thead>
            <tbody>
              {ventas.map(v => (
                <tr key={v.id}>
                  <Td><strong>{v.numero_comprobante}</strong></Td>
                  <Td>{fmtDateTime(v.fecha)}</Td>
                  <Td>{v.usuarios?.nombre || '—'}</Td>
                  <Td>{v.clientes?.nombre || <span style={{ color: '#aaa' }}>Sin registrar</span>}</Td>
                  <Td>{v.forma_pago ? FORMAS_PAGO[v.forma_pago] || v.forma_pago : <span style={{ color: '#aaa' }}>—</span>}</Td>
                  <Td right><strong>{fmtPEN(v.total_pen)}</strong></Td>
                  <Td><span onClick={() => { setEliminando(v.id); setPasswordInput(''); setErrorPass('') }} style={{ cursor: 'pointer', color: ROJO, fontSize: 11.5, fontWeight: 'bold' }}>Revertir</span></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }

      {eliminando && (
        <Modal title="Revertir venta" onClose={() => setEliminando(null)}>
          <p style={{ fontSize: 13, color: GRIS, marginTop: 0 }}>
            Esta acción revierte la venta: elimina el comprobante y sus ítems, y devuelve el stock vendido al inventario. No se puede deshacer.
          </p>
          <Campo label="Contraseña especial">
            <input type="password" style={inputStyle} value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="Contraseña" autoFocus />
          </Campo>
          {errorPass && <div style={{ color: ROJO, fontSize: 12.5, marginTop: -8, marginBottom: 10 }}>{errorPass}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <BtnSecondary onClick={() => setEliminando(null)}>Cancelar</BtnSecondary>
            <Btn onClick={confirmarEliminar} disabled={borrando} style={{ background: ROJO }}>{borrando ? 'Revirtiendo...' : 'Revertir venta'}</Btn>
          </div>
        </Modal>
      )}
    </Panel>
  )
}

// ---- TRAZABILIDAD ----
function Trazabilidad({ importaciones, onRefresh }) {
  const [editandoCosto, setEditandoCosto] = useState(null)
  const [costoVal, setCostoVal] = useState('')
  const [saving, setSaving] = useState(false)
  const [editandoItem, setEditandoItem] = useState(null)
  const [itemForm, setItemForm] = useState({})
  const [integrando, setIntegrando] = useState(false)
  const [categorias, setCategorias] = useState([])
  const [categoriaElegida, setCategoriaElegida] = useState('')
  const [savingIntegrar, setSavingIntegrar] = useState(false)
  const lote = importaciones[0]

  useEffect(() => {
    fetch('/api/categorias').then(r => r.json()).then(d => { if (Array.isArray(d)) setCategorias(d) })
  }, [])

  if (!lote) return <div style={{ color: GRIS }}>No hay importaciones registradas</div>

  const totalCompra = lote.importacion_items?.reduce((s, i) => s + i.precio_compra_unit_usd * i.cantidad, 0) || 0
  const logisticaCompleta = lote.costo_flete_usd != null && lote.costo_aduanas_usd != null && lote.costo_transporte_local_usd != null

  async function guardarCosto() {
    setSaving(true)
    await fetch('/api/importaciones', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lote.id, [editandoCosto]: parseFloat(costoVal) || null }),
    })
    setSaving(false)
    setEditandoCosto(null)
    onRefresh()
  }

  async function cambiarEstado(e) {
    await fetch('/api/importaciones', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lote.id, estado: e.target.value }),
    })
    onRefresh()
  }

  const ESTADOS = ['orden_compra','en_transito','en_aduana','en_inventario','distribuido']
  const ESTADO_LABELS = { orden_compra:'Orden de compra', en_transito:'En tránsito', en_aduana:'En aduana', en_inventario:'En inventario', distribuido:'Distribuido' }
  const pendientesIntegrar = (lote.importacion_items || []).filter(i => !i.producto_id).length

  async function guardarItem() {
    setSaving(true)
    await fetch('/api/importaciones', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: editandoItem, descripcion: itemForm.descripcion, cantidad: parseFloat(itemForm.cantidad), precio_compra_unit_usd: parseFloat(itemForm.precio_compra_unit_usd) }),
    })
    setSaving(false)
    setEditandoItem(null)
    onRefresh()
  }

  async function confirmarIntegrar() {
    if (!categoriaElegida) { alert('Elige una categoría'); return }
    setSavingIntegrar(true)
    const res = await fetch('/api/importaciones/integrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lote_id: lote.id, categoria_id: parseInt(categoriaElegida) }),
    })
    const data = await res.json()
    setSavingIntegrar(false)
    if (!res.ok) { alert(data.error || 'No se pudo integrar'); return }
    setIntegrando(false)
    alert(`${data.creados} producto(s) agregados al inventario.`)
    onRefresh()
  }

  return (
    <div>
      {logisticaCompleta
        ? <Notice green>Costos completos — el costo real puesto en depósito ya está calculado para cada ítem.</Notice>
        : <Notice>Faltan costos logísticos. Haz clic en cada recuadro para actualizarlo.</Notice>
      }
      <div style={{ background: '#fff', border: `1px solid ${BORDE}`, borderRadius: 8, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h3 style={{ fontSize: 15, margin: 0 }}>Lote {lote.codigo_lote}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {logisticaCompleta && pendientesIntegrar > 0 && (
              <BtnSmall onClick={() => { setIntegrando(true); setCategoriaElegida('') }}>Integrar a inventario ({pendientesIntegrar})</BtnSmall>
            )}
            <span style={{ fontSize: 11, fontWeight: 'bold', padding: '4px 10px', borderRadius: 20, background: logisticaCompleta ? '#E1F0E3' : '#FCEFD9', color: logisticaCompleta ? VERDE : AMBER }}>
              {ESTADO_LABELS[lote.estado] || lote.estado}
            </span>
          </div>
        </div>
        <p style={{ fontSize: 12, color: GRIS, marginBottom: 14 }}>17 ítems · Origen: Australia · Destino: Trujillo</p>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11.5, color: GRIS, marginRight: 8 }}>Cambiar estado:</label>
          <select value={lote.estado} onChange={cambiarEstado} style={{ fontFamily: 'Arial', fontSize: 12.5, padding: '6px 10px', border: `1px solid ${BORDE}`, borderRadius: 6 }}>
            {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 14 }}>
          {[
            { label: 'Total compra', val: fmtUSD(totalCompra), field: null },
            { label: 'Transporte marítimo', val: lote.costo_flete_usd != null ? fmtUSD(lote.costo_flete_usd) : 'Clic para cargar', field: 'costo_flete_usd' },
            { label: 'Aduanas', val: lote.costo_aduanas_usd != null ? fmtUSD(lote.costo_aduanas_usd) : 'Clic para cargar', field: 'costo_aduanas_usd' },
            { label: 'Transporte Lima-Trujillo', val: lote.costo_transporte_local_usd != null ? fmtUSD(lote.costo_transporte_local_usd) : 'Clic para cargar', field: 'costo_transporte_local_usd' },
          ].map(({ label, val, field }) => (
            <div key={label} onClick={() => field && (setEditandoCosto(field), setCostoVal(''))} style={{
              border: `1px ${field ? 'dashed' : 'solid'} ${field ? '#B8B5AE' : BORDE}`, borderRadius: 6,
              padding: '10px 12px', textAlign: 'center', cursor: field ? 'pointer' : 'default'
            }}>
              <div style={{ fontSize: 10.5, color: GRIS, textTransform: 'uppercase' }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 'bold', marginTop: 4, color: !field ? NEGRO : (val.includes('$') ? NEGRO : AMBER) }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
      <Panel title={`Ítems del lote — ${lote.codigo_lote}`}>
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#F7F6F4' }}>
              {['Código','Descripción','Cant.','Precio unit.','Total compra','Puesto en depo','Estado',''].map(h => <Th key={h}>{h}</Th>)}
            </tr></thead>
            <tbody>
              {lote.importacion_items?.map(item => {
                const totalItem = item.precio_compra_unit_usd * item.cantidad
                const peso = totalCompra > 0 ? totalItem / totalCompra : 0
                const costoDepo = logisticaCompleta
                  ? totalItem + (lote.costo_flete_usd + lote.costo_aduanas_usd + lote.costo_transporte_local_usd) * peso
                  : null
                return (
                  <tr key={item.id}>
                    <Td>{item.codigo_legacy}</Td>
                    <Td>{item.descripcion}</Td>
                    <Td right>{item.cantidad}</Td>
                    <Td right>{fmtUSD(item.precio_compra_unit_usd)}</Td>
                    <Td right>{fmtUSD(totalItem)}</Td>
                    <Td right>{costoDepo ? <strong>{fmtUSD(costoDepo)}</strong> : <Badge color={AMBER}>Falta logística</Badge>}</Td>
                    <Td>{item.producto_id ? <Badge color={VERDE}>Integrado</Badge> : <Badge color={AMBER}>Pendiente</Badge>}</Td>
                    <Td><span onClick={() => { setEditandoItem(item.id); setItemForm({ descripcion: item.descripcion, cantidad: item.cantidad, precio_compra_unit_usd: item.precio_compra_unit_usd }) }} style={{ cursor: 'pointer', color: NARANJA, fontSize: 11.5, fontWeight: 'bold' }}>Editar</span></Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      {editandoCosto && (
        <Modal title="Actualizar costo" onClose={() => setEditandoCosto(null)}>
          <Campo label="Monto (USD)"><input type="number" style={inputStyle} value={costoVal} onChange={e => setCostoVal(e.target.value)} placeholder="0.00" autoFocus /></Campo>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <BtnSecondary onClick={() => setEditandoCosto(null)}>Cancelar</BtnSecondary>
            <Btn onClick={guardarCosto} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
          </div>
        </Modal>
      )}

      {editandoItem && (
        <Modal title="Editar ítem del lote" onClose={() => setEditandoItem(null)}>
          <Campo label="Descripción"><input style={inputStyle} value={itemForm.descripcion || ''} onChange={e => setItemForm({...itemForm, descripcion: e.target.value})} /></Campo>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Campo label="Cantidad"><input type="number" style={inputStyle} value={itemForm.cantidad ?? ''} onChange={e => setItemForm({...itemForm, cantidad: e.target.value})} /></Campo>
            <Campo label="Precio compra unit. (USD)"><input type="number" style={inputStyle} value={itemForm.precio_compra_unit_usd ?? ''} onChange={e => setItemForm({...itemForm, precio_compra_unit_usd: e.target.value})} /></Campo>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <BtnSecondary onClick={() => setEditandoItem(null)}>Cancelar</BtnSecondary>
            <Btn onClick={guardarItem} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Btn>
          </div>
        </Modal>
      )}

      {integrando && (
        <Modal title="Integrar a inventario" onClose={() => setIntegrando(false)}>
          <p style={{ fontSize: 13, color: GRIS, marginTop: 0 }}>
            Se van a crear {pendientesIntegrar} producto(s) nuevos en Inventario, con el costo puesto en depósito ya calculado. El precio de venta quedará vacío para completarlo después.
          </p>
          <Campo label="Categoría para estos productos">
            <select style={inputStyle} value={categoriaElegida} onChange={e => setCategoriaElegida(e.target.value)}>
              <option value="">Selecciona una categoría...</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </Campo>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <BtnSecondary onClick={() => setIntegrando(false)}>Cancelar</BtnSecondary>
            <Btn onClick={confirmarIntegrar} disabled={savingIntegrar}>{savingIntegrar ? 'Integrando...' : 'Integrar'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ---- GASTOS ----
function Gastos({ gastos, session, onRefresh }) {
  const formInicial = { descripcion: '', monto: '', sede: 'Trujillo', fecha: new Date().toISOString().slice(0,10), realizado_por: '', para_que: '', referencia: '', notas: '' }
  const [form, setForm] = useState(formInicial)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [eliminando, setEliminando] = useState(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [errorPass, setErrorPass] = useState('')
  const [borrando, setBorrando] = useState(false)

  const totalGeneral = gastos.reduce((s, g) => s + g.monto, 0)
  const totalTrujillo = gastos.filter(g => g.sede === 'Trujillo').reduce((s, g) => s + g.monto, 0)
  const totalLima = gastos.filter(g => g.sede === 'Lima').reduce((s, g) => s + g.monto, 0)

  async function guardar() {
    if (!form.descripcion || !form.monto) { alert('Completa descripción (motivo) y monto'); return }
    setSaving(true)
    const res = await fetch('/api/gastos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, monto: parseFloat(form.monto) }),
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert('No se pudo guardar el gasto: ' + (err.error || 'Error desconocido'))
      return
    }
    setShowForm(false)
    setForm(formInicial)
    onRefresh()
  }

  async function confirmarEliminar() {
    if (!passwordInput) { setErrorPass('Ingresa la contraseña'); return }
    setBorrando(true)
    setErrorPass('')
    const res = await fetch('/api/gastos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: eliminando, password: passwordInput }),
    })
    setBorrando(false)
    if (res.status === 401) { setErrorPass('Contraseña incorrecta'); return }
    if (!res.ok) { setErrorPass('No se pudo eliminar, intenta de nuevo'); return }
    setEliminando(null)
    setPasswordInput('')
    onRefresh()
  }

  function exportar() {
    descargarCSV(
      `gastos_${new Date().toISOString().slice(0,10)}.csv`,
      ['Fecha', 'Descripción/Motivo', 'Realizado por', 'Para qué', 'Referencia', 'Notas', 'Sede', 'Monto'],
      gastos.map(g => [fmtDate(g.fecha), g.descripcion, g.realizado_por || '', g.para_que || '', g.referencia || '', g.notas || '', g.sede, g.monto])
    )
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 22 }}>
        <KPI v={fmtPEN(totalGeneral)} l="Total gastos registrados" />
        <KPI v={fmtPEN(totalTrujillo)} l="Gastos Trujillo" />
        <KPI v={fmtPEN(totalLima)} l="Gastos Lima" />
      </div>
      <Panel>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDE}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <BtnSmall onClick={exportar}>⬇ Descargar CSV</BtnSmall>
          <BtnSmall onClick={() => setShowForm(true)}>+ Registrar gasto</BtnSmall>
        </div>
        {gastos.length === 0
          ? <div style={{ padding: 30, textAlign: 'center', color: GRIS }}>Aún no hay gastos registrados</div>
          : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#F7F6F4' }}>
              {['Fecha','Descripción / Motivo','Realizado por','Sede','Monto',''].map(h => <Th key={h}>{h}</Th>)}
            </tr></thead>
            <tbody>
              {[...gastos].reverse().map(g => (
                <tr key={g.id}>
                  <Td>{fmtDate(g.fecha)}</Td>
                  <Td>
                    {g.descripcion}
                    {(g.para_que || g.referencia) && (
                      <div style={{ fontSize: 11, color: GRIS, marginTop: 2 }}>
                        {g.para_que && <span>Para: {g.para_que}</span>}
                        {g.para_que && g.referencia && <span> · </span>}
                        {g.referencia && <span>Ref: {g.referencia}</span>}
                      </div>
                    )}
                  </Td>
                  <Td>{g.realizado_por || <span style={{ color: '#aaa' }}>—</span>}</Td>
                  <Td><span style={{ fontSize: 11, color: GRIS }}>{g.sede}</span></Td>
                  <Td right><strong>{fmtPEN(g.monto)}</strong></Td>
                  <Td><span onClick={() => { setEliminando(g.id); setPasswordInput(''); setErrorPass('') }} style={{ cursor: 'pointer', color: ROJO, fontSize: 11.5, fontWeight: 'bold' }}>Eliminar</span></Td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </Panel>
      {eliminando && (
        <Modal title="Eliminar gasto" onClose={() => setEliminando(null)}>
          <p style={{ fontSize: 13, color: GRIS, marginTop: 0 }}>
            Esta acción elimina el gasto de forma permanente. No se puede deshacer.
          </p>
          <Campo label="Contraseña especial de eliminación">
            <input type="password" style={inputStyle} value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="Contraseña" autoFocus />
          </Campo>
          {errorPass && <div style={{ color: ROJO, fontSize: 12.5, marginTop: -8, marginBottom: 10 }}>{errorPass}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <BtnSecondary onClick={() => setEliminando(null)}>Cancelar</BtnSecondary>
            <Btn onClick={confirmarEliminar} disabled={borrando} style={{ background: ROJO }}>{borrando ? 'Eliminando...' : 'Eliminar definitivamente'}</Btn>
          </div>
        </Modal>
      )}

      {showForm && (
        <Modal title="Registrar gasto" onClose={() => setShowForm(false)}>
          <Campo label="Motivo del gasto"><input style={inputStyle} value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Ej. Reparación de compresora" /></Campo>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Campo label="Quién realizó el gasto"><input style={inputStyle} value={form.realizado_por} onChange={e => setForm({...form, realizado_por: e.target.value})} placeholder="Nombre" /></Campo>
            <Campo label="Para qué se realizó"><input style={inputStyle} value={form.para_que} onChange={e => setForm({...form, para_que: e.target.value})} placeholder="Ej. Mantenimiento equipo X" /></Campo>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Campo label="Monto (S/)"><input type="number" style={inputStyle} value={form.monto} onChange={e => setForm({...form, monto: e.target.value})} placeholder="0.00" /></Campo>
            <Campo label="Fecha"><input type="date" style={inputStyle} value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} /></Campo>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Campo label="Referencia"><input style={inputStyle} value={form.referencia} onChange={e => setForm({...form, referencia: e.target.value})} placeholder="N° comprobante, etc." /></Campo>
            <Campo label="Sede">
              <select style={inputStyle} value={form.sede} onChange={e => setForm({...form, sede: e.target.value})}>
                <option value="Trujillo">Trujillo</option>
                <option value="Lima">Lima</option>
                <option value="General">General</option>
              </select>
            </Campo>
          </div>
          <Campo label="Notas / detalle (opcional)">
            <textarea style={{...inputStyle, minHeight: 70, resize: 'vertical'}} value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} placeholder="Detalle libre — útil para historial de mantenimiento, por ejemplo" />
          </Campo>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <BtnSecondary onClick={() => setShowForm(false)}>Cancelar</BtnSecondary>
            <Btn onClick={guardar} disabled={saving}>{saving ? 'Guardando...' : 'Guardar gasto'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ---- REPORTES ----
function Reportes({ ventas, gastos }) {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  let ventasFilt = ventas
  let gastosFilt = gastos
  if (desde) { ventasFilt = ventasFilt.filter(v => v.fecha.slice(0,10) >= desde); gastosFilt = gastosFilt.filter(g => g.fecha >= desde) }
  if (hasta) { ventasFilt = ventasFilt.filter(v => v.fecha.slice(0,10) <= hasta); gastosFilt = gastosFilt.filter(g => g.fecha <= hasta) }

  const totalVentas = ventasFilt.reduce((s, v) => s + v.total_pen, 0)
  const totalGastos = gastosFilt.reduce((s, g) => s + g.monto, 0)
  const ticketProm = ventasFilt.length > 0 ? totalVentas / ventasFilt.length : 0

  const porProducto = {}
  ventasFilt.forEach(v => {
    v.venta_items?.forEach(i => {
      const key = i.producto_id
      if (!porProducto[key]) porProducto[key] = { descripcion: i.productos?.descripcion || '—', cantidad: 0, total: 0 }
      porProducto[key].cantidad += i.cantidad
      porProducto[key].total += i.subtotal_pen
    })
  })

  function exportarVentas() {
    descargarCSV(`reporte_ventas_${new Date().toISOString().slice(0,10)}.csv`,
      ['Producto', 'Cantidad vendida', 'Total vendido'],
      Object.values(porProducto).sort((a,b) => b.total - a.total).map(p => [p.descripcion, p.cantidad, p.total]))
  }

  return (
    <div>
      <Panel>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${BORDE}`, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 11.5, color: GRIS }}>Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)} style={{ fontFamily: 'Arial', fontSize: 12.5, padding: '6px 9px', border: `1px solid ${BORDE}`, borderRadius: 6 }} />
          <label style={{ fontSize: 11.5, color: GRIS }}>Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={{ fontFamily: 'Arial', fontSize: 12.5, padding: '6px 9px', border: `1px solid ${BORDE}`, borderRadius: 6 }} />
          <BtnSmall onClick={() => { setDesde(''); setHasta('') }}>Limpiar</BtnSmall>
          <div style={{ marginLeft: 'auto' }}><BtnSmall onClick={exportarVentas}>⬇ Descargar CSV</BtnSmall></div>
        </div>
      </Panel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        <KPI v={fmtPEN(totalVentas)} l="Ventas totales" />
        <KPI v={ventasFilt.length} l="Comprobantes" />
        <KPI v={fmtPEN(ticketProm)} l="Ticket promedio" />
        <KPI v={fmtPEN(totalVentas - totalGastos)} l="Utilidad estimada" color={totalVentas - totalGastos < 0 ? ROJO : undefined} />
      </div>
      <Panel title="Ventas por producto">
        {Object.keys(porProducto).length === 0
          ? <div style={{ padding: 30, textAlign: 'center', color: GRIS }}>No hay ventas en este periodo</div>
          : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#F7F6F4' }}>
              {['Producto','Cantidad vendida','Total vendido'].map(h => <Th key={h}>{h}</Th>)}
            </tr></thead>
            <tbody>
              {Object.values(porProducto).sort((a,b) => b.total - a.total).map((p, i) => (
                <tr key={i}>
                  <Td>{p.descripcion}</Td>
                  <Td right>{p.cantidad}</Td>
                  <Td right><strong>{fmtPEN(p.total)}</strong></Td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </Panel>
    </div>
  )
}

// ---- USUARIOS ----
function Usuarios({ usuarios, onRefresh }) {
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const ROL_LABELS = { admin_global: 'Admin Global', pos_trujillo: 'POS Trujillo', contador: 'Contador' }

  async function guardar() {
    setSaving(true)
    const res = await fetch('/api/usuarios', {
      method: editando === 'nuevo' ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert('No se pudo guardar el usuario: ' + (err.error || 'Error desconocido'))
      return
    }
    setEditando(null)
    onRefresh()
  }

  return (
    <div>
      <Panel>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDE}`, display: 'flex', justifyContent: 'flex-end' }}>
          <BtnSmall onClick={() => { setEditando('nuevo'); setForm({ rol: 'admin_global', sede: 'Lima' }) }}>+ Agregar usuario</BtnSmall>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: '#F7F6F4' }}>
            {['Nombre','Email','Rol','Sede',''].map(h => <Th key={h}>{h}</Th>)}
          </tr></thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id}>
                <Td><strong>{u.nombre}</strong></Td>
                <Td>{u.email}</Td>
                <Td><Badge color={u.rol === 'admin_global' ? NARANJA : u.rol === 'pos_trujillo' ? VERDE : '#1D4E89'}>{ROL_LABELS[u.rol]}</Badge></Td>
                <Td>{u.sede}</Td>
                <Td><span onClick={() => { setEditando(u.id); setForm(u) }} style={{ cursor: 'pointer', color: NARANJA, fontSize: 11.5, fontWeight: 'bold' }}>Editar</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {editando && (
        <Modal title={editando === 'nuevo' ? 'Agregar usuario' : 'Editar usuario'} onClose={() => setEditando(null)}>
          <Campo label="Nombre completo"><input style={inputStyle} value={form.nombre || ''} onChange={e => setForm({...form, nombre: e.target.value})} /></Campo>
          <Campo label="Email"><input type="email" style={inputStyle} value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} /></Campo>
          {editando === 'nuevo' && <Campo label="Contraseña"><input type="password" style={inputStyle} value={form.password || ''} onChange={e => setForm({...form, password: e.target.value})} /></Campo>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Campo label="Rol">
              <select style={inputStyle} value={form.rol || 'admin_global'} onChange={e => setForm({...form, rol: e.target.value})}>
                <option value="admin_global">Admin Global</option>
                <option value="pos_trujillo">POS Trujillo</option>
                <option value="contador">Contador</option>
              </select>
            </Campo>
            <Campo label="Sede"><input style={inputStyle} value={form.sede || ''} onChange={e => setForm({...form, sede: e.target.value})} /></Campo>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <BtnSecondary onClick={() => setEditando(null)}>Cancelar</BtnSecondary>
            <Btn onClick={guardar} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ---- COMPONENTES UI REUTILIZABLES ----
function Panel({ title, children }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDE}`, borderRadius: 8, marginBottom: 22, overflow: 'hidden' }}>
      {title && <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDE}`, fontSize: 14.5, fontWeight: 'bold' }}>{title}</div>}
      {children}
    </div>
  )
}

function KPI({ v, l, color }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDE}`, borderRadius: 8, padding: '16px 18px' }}>
      <div style={{ fontSize: 22, fontWeight: 'bold', color: color || NEGRO }}>{v}</div>
      <div style={{ fontSize: 11.5, color: GRIS, marginTop: 3 }}>{l}</div>
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
      <div style={{ background: '#fff', borderRadius: 10, width: 560, maxWidth: '100%', maxHeight: '88vh', overflow: 'auto' }}>
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

function Notice({ children, green }) {
  return <div style={{ background: green ? '#EAF6EC' : '#FFF6E8', border: `1px solid ${green ? '#B9DDC0' : '#F0D9A6'}`, borderRadius: 8, padding: '12px 16px', fontSize: 12.5, color: green ? '#1E5C2C' : '#7A5400', marginBottom: 18, lineHeight: 1.5 }}>{children}</div>
}

function Btn({ children, onClick, disabled, style = {} }) {
  return <button onClick={onClick} disabled={disabled} style={{ background: disabled ? '#B8B5AE' : NARANJA, color: '#fff', border: 'none', borderRadius: 6, padding: '11px 16px', fontWeight: 'bold', fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer', flex: 1, ...style }}>{children}</button>
}

function BtnSecondary({ children, onClick }) {
  return <button onClick={onClick} style={{ background: '#fff', color: NEGRO, border: `1px solid ${BORDE}`, borderRadius: 6, padding: '11px 16px', fontSize: 13, cursor: 'pointer', flex: 1 }}>{children}</button>
}

function BtnSmall({ children, onClick }) {
  return <button onClick={onClick} style={{ background: NARANJA, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 12.5, fontWeight: 'bold', cursor: 'pointer' }}>{children}</button>
}

const inputStyle = { width: '100%', fontFamily: 'Arial', fontSize: 13.5, padding: '9px 12px', border: `1px solid ${BORDE}`, borderRadius: 7, boxSizing: 'border-box' }
