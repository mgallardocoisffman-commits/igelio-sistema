'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const NARANJA = '#E8581A'
const NEGRO = '#111111'
const GRIS = '#6B6862'
const BORDE = '#E3E0DA'

const fmtPEN = n => n == null ? '—' : 'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })
const fmtDateTime = d => new Date(d).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const FORMAS_PAGO = { pos: 'POS / Tarjeta', yape: 'Yape', plin: 'Plin', efectivo: 'Efectivo', transferencia: 'Transferencia' }

function ComprobanteInner() {
    const params = useSearchParams()
    const tipo = params.get('tipo') || 'venta'
    const id = params.get('id')
    const [doc, setDoc] = useState(null)
    const [loading, setLoading] = useState(true)

  useEffect(() => {
        if (!id) return
        const url = tipo === 'cotizacion' ? `/api/cotizaciones?id=${id}` : `/api/ventas?id=${id}`
        fetch(url).then(r => r.json()).then(data => {
                setDoc(Array.isArray(data) ? data[0] : data)
                setLoading(false)
        })
  }, [id, tipo])

  useEffect(() => {
        if (doc && !loading) {
                setTimeout(() => window.print(), 400)
        }
  }, [doc, loading])

  if (loading) return <div style={{ padding: 40, fontFamily: 'Arial', color: GRIS }}>Cargando comprobante...</div>
  if (!doc) return <div style={{ padding: 40, fontFamily: 'Arial', color: GRIS }}>No se encontro el documento.</div>

  const esVenta = tipo !== 'cotizacion'
  const numero = esVenta ? doc.numero_comprobante : doc.numero
  const items = esVenta ? doc.venta_items : doc.cotizacion_items
  const cliente = doc.clientes
  const fecha = doc.fecha
  const total = doc.total_pen

  return (
        <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 720, margin: '0 auto', padding: 30, color: NEGRO }}>
      <style>{`
              @media print {
                        .no-print { display: none !important; }
                                  body { margin: 0; }
                                          }
                                                  @media screen {
                                                            body { background: #F0EEEA; }
                                                                    }
                                                                          `}</style>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 16 }}>
        <button onClick={() => window.print()} style={{ background: NARANJA, color: '#fff', border: 'none', borderRadius: 6, padding: '10px 16px', fontWeight: 'bold', fontSize: 13, cursor: 'pointer' }}>
          Imprimir / Guardar como PDF
            </button>
            </div>

      <div style={{ background: '#fff', border: `1px solid ${BORDE}`, borderRadius: 10, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${NEGRO}`, paddingBottom: 18, marginBottom: 20 }}>
          <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 2 }}>
{[0,1,2].map(i => <span key={i} style={{ display: 'block', width: 5, height: 24, background: NARANJA, borderRadius: 1 }} />)}
  </div>
              <div style={{ fontWeight: 'bold', fontSize: 18 }}>IGE</div>
  </div>
            <div style={{ fontSize: 11.5, color: GRIS, marginTop: 4 }}>Importaciones Generales Elio</div>
            <div style={{ fontSize: 11.5, color: GRIS }}>Trujillo, Peru</div>
  </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', color: NARANJA }}>
{esVenta ? 'Comprobante de venta' : 'Cotizacion'}
</div>
            <div style={{ fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>{numero}</div>
            <div style={{ fontSize: 11.5, color: GRIS, marginTop: 4 }}>{fmtDateTime(fecha)}</div>
  </div>
  </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10.5, color: GRIS, textTransform: 'uppercase', marginBottom: 4 }}>Cliente</div>
          <div style={{ fontSize: 14, fontWeight: 'bold' }}>{cliente?.nombre || 'Cliente varios'}</div>
{cliente?.ruc && <div style={{ fontSize: 12, color: GRIS }}>RUC/DNI: {cliente.ruc}</div>}
{cliente?.telefono && <div style={{ fontSize: 12, color: GRIS }}>Tel: {cliente.telefono}</div>}
  </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 20 }}>
          <thead>
              <tr style={{ borderBottom: `2px solid ${NEGRO}` }}>
              <th style={{ textAlign: 'left', padding: '8px 4px', fontSize: 11, textTransform: 'uppercase' }}>Descripcion</th>
              <th style={{ textAlign: 'right', padding: '8px 4px', fontSize: 11, textTransform: 'uppercase' }}>Cant.</th>
              <th style={{ textAlign: 'right', padding: '8px 4px', fontSize: 11, textTransform: 'uppercase' }}>P. Unit.</th>
              <th style={{ textAlign: 'right', padding: '8px 4px', fontSize: 11, textTransform: 'uppercase' }}>Subtotal</th>
  </tr>
  </thead>
          <tbody>
{items?.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${BORDE}` }}>
                            <td style={{ padding: '10px 4px' }}>{esVenta ? item.productos?.descripcion : item.descripcion}</td>
                            <td style={{ padding: '10px 4px', textAlign: 'right' }}>{item.cantidad} {item.unidad || ''}</td>
                <td style={{ padding: '10px 4px', textAlign: 'right' }}>{fmtPEN(esVenta ? item.precio_venta_unit_pen : item.precio_unit_pen)}</td>
                <td style={{ padding: '10px 4px', textAlign: 'right' }}>{fmtPEN(item.subtotal_pen)}</td>
  </tr>
            ))}
              </tbody>
              </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <div style={{ width: 220 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: `2px solid ${NEGRO}`, fontWeight: 'bold', fontSize: 16 }}>
              <span>Total</span><span>{fmtPEN(total)}</span>
              </div>
              </div>
              </div>

{esVenta && doc.forma_pago && (
            <div style={{ fontSize: 12, color: GRIS, borderTop: `1px solid ${BORDE}`, paddingTop: 14 }}>
            Forma de pago: <strong>{FORMAS_PAGO[doc.forma_pago] || doc.forma_pago}</strong>
              </div>
        )}
{!esVenta && (
            <div style={{ fontSize: 12, color: GRIS, borderTop: `1px solid ${BORDE}`, paddingTop: 14 }}>
            Documento de cotizacion - no constituye comprobante de pago. Valido segun coordinacion con IGE.
              </div>
        )}
</div>
  </div>
  )
}

export default function ComprobantePage() {
    return (
          <Suspense fallback={<div style={{ padding: 40, fontFamily: 'Arial' }}>Cargando...</div>}>
      <ComprobanteInner />
  </Suspense>
  )
}
