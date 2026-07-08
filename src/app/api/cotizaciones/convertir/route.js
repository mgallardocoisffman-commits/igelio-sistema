import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// POST /api/cotizaciones/convertir — genera una venta a partir de una cotización
export async function POST(request) {
    const body = await request.json()
    const { cotizacion_id, forma_pago } = body

  const { data: cot, error: cotError } = await supabaseAdmin
      .from('cotizaciones')
      .select('*, cotizacion_items(*)')
      .eq('id', cotizacion_id)
      .single()

  if (cotError || !cot) return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    if (cot.estado === 'convertida') return NextResponse.json({ error: 'Esta cotización ya fue convertida en venta' }, { status: 400 })
    if (cot.estado === 'anulada') return NextResponse.json({ error: 'Esta cotización está anulada' }, { status: 400 })

  const { count } = await supabaseAdmin.from('ventas').select('*', { count: 'exact', head: true })
    const numero = 'B' + String((count || 0) + 1).padStart(4, '0')

  const { data: venta, error: ventaError } = await supabaseAdmin
      .from('ventas')
      .insert([{
              numero_comprobante: numero,
              cliente_id: cot.cliente_id,
              vendedor_id: cot.vendedor_id,
              sede: cot.sede,
              total_pen: cot.total_pen,
              forma_pago,
      }])
      .select()
      .single()

  if (ventaError) return NextResponse.json({ error: ventaError.message }, { status: 500 })

  const itemsConProducto = (cot.cotizacion_items || []).filter(i => i.producto_id)
    if (itemsConProducto.length > 0) {
          const ventaItems = itemsConProducto.map(item => ({
                  venta_id: venta.id,
                  producto_id: item.producto_id,
                  cantidad: item.cantidad,
                  precio_venta_unit_pen: item.precio_unit_pen,
                  subtotal_pen: item.subtotal_pen,
          }))
          await supabaseAdmin.from('venta_items').insert(ventaItems)

      const { data: catServicios } = await supabaseAdmin
            .from('categorias')
            .select('id')
            .ilike('nombre', 'Servicios')
            .maybeSingle()
          const servicioCategoriaId = catServicios?.id

      for (const item of itemsConProducto) {
              const { data: prod } = await supabaseAdmin
                .from('productos')
                .select('stock, categoria_id')
                .eq('id', item.producto_id)
                .single()

            if (servicioCategoriaId && prod?.categoria_id === servicioCategoriaId) continue

            await supabaseAdmin
                .from('productos')
                .update({ stock: Math.max(0, (prod?.stock || 0) - item.cantidad) })
                .eq('id', item.producto_id)
      }
    }

  await supabaseAdmin
      .from('cotizaciones')
      .update({ estado: 'convertida', venta_id: venta.id })
      .eq('id', cotizacion_id)

  return NextResponse.json({ ...venta, numero_comprobante: numero }, { status: 201 })
}

// padding
