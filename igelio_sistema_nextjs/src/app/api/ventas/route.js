import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// GET /api/ventas — listar ventas con filtro de fecha
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')

  let query = supabaseAdmin
    .from('ventas')
    .select('*, clientes(nombre, ruc, telefono, direccion), usuarios(nombre), venta_items(*, productos(descripcion, codigo_legacy))')
    .order('fecha', { ascending: false })

  if (desde) query = query.gte('fecha', desde)
  if (hasta) query = query.lte('fecha', hasta + 'T23:59:59')

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/ventas — crear nueva venta y descontar stock
export async function POST(request) {
  const body = await request.json()
  const { cliente, items, vendedor_id, sede, total_pen, forma_pago } = body

  // 1. Crear o encontrar cliente
  let cliente_id = null
  if (cliente?.nombre) {
    const { data: clienteExistente } = await supabaseAdmin
      .from('clientes')
      .select('id')
      .ilike('nombre', cliente.nombre)
      .single()

    if (clienteExistente) {
      cliente_id = clienteExistente.id
      await supabaseAdmin.from('clientes').update({
        telefono: cliente.telefono || undefined,
        ruc: cliente.ruc || undefined,
        direccion: cliente.direccion || undefined,
      }).eq('id', cliente_id)
    } else {
      const { data: nuevoCliente } = await supabaseAdmin
        .from('clientes')
        .insert([cliente])
        .select('id')
        .single()
      cliente_id = nuevoCliente?.id
    }
  }

  // 2. Generar numero de comprobante
  const { count } = await supabaseAdmin.from('ventas').select('*', { count: 'exact', head: true })
  const numero = 'B' + String((count || 0) + 1).padStart(4, '0')

  // 3. Crear la venta
  const { data: venta, error: ventaError } = await supabaseAdmin
    .from('ventas')
    .insert([{ numero_comprobante: numero, cliente_id, vendedor_id, sede, total_pen, forma_pago }])
    .select()
    .single()

  if (ventaError) return NextResponse.json({ error: ventaError.message }, { status: 500 })

  // 4. Insertar items de la venta
  const ventaItems = items.map(item => ({
    venta_id: venta.id,
    producto_id: item.producto_id,
    cantidad: item.cantidad,
    precio_venta_unit_pen: item.precio,
    subtotal_pen: item.precio * item.cantidad,
  }))

  const { error: itemsError } = await supabaseAdmin.from('venta_items').insert(ventaItems)
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

  // 5. Descontar stock de cada producto
  for (const item of items) {
    const { data: prod } = await supabaseAdmin
      .from('productos')
      .select('stock')
      .eq('id', item.producto_id)
      .single()

    await supabaseAdmin
      .from('productos')
      .update({ stock: Math.max(0, (prod?.stock || 0) - item.cantidad) })
      .eq('id', item.producto_id)
  }

  return NextResponse.json({ ...venta, numero_comprobante: numero }, { status: 201 })
}
