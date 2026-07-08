import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// GET /api/cotizaciones — listar cotizaciones con cliente e items
export async function GET() {
    const { data, error } = await supabaseAdmin
      .from('cotizaciones')
      .select('*, clientes(nombre, ruc, telefono), usuarios(nombre), cotizacion_items(*, productos(descripcion, codigo_legacy))')
      .order('fecha', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

// POST /api/cotizaciones — crear nueva cotización con sus items
export async function POST(request) {
    const body = await request.json()
    const { cliente, items, vendedor_id, sede, total_pen } = body

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
                        ruc: cliente.ruc || undefined,
                        telefono: cliente.telefono || undefined,
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

  const { count } = await supabaseAdmin.from('cotizaciones').select('*', { count: 'exact', head: true })
    const numero = 'COT-' + String((count || 0) + 1).padStart(4, '0')

  const { data: cotizacion, error: cotError } = await supabaseAdmin
      .from('cotizaciones')
      .insert([{ numero, cliente_id, vendedor_id, sede, total_pen, estado: 'registrado' }])
      .select()
      .single()

  if (cotError) return NextResponse.json({ error: cotError.message }, { status: 500 })

  const cotItems = items.map(item => ({
        cotizacion_id: cotizacion.id,
        producto_id: item.producto_id || null,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        unidad: item.unidad,
        precio_unit_pen: item.precio_unit,
        subtotal_pen: item.precio_unit * item.cantidad,
  }))

  const { error: itemsError } = await supabaseAdmin.from('cotizacion_items').insert(cotItems)
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

  return NextResponse.json({ ...cotizacion, numero }, { status: 201 })
}

// PUT /api/cotizaciones — actualizar estado (ej. anular)
export async function PUT(request) {
    const body = await request.json()
    const { id, estado } = body
    const { data, error } = await supabaseAdmin
      .from('cotizaciones')
      .update({ estado })
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

// padding line to protect tail from truncation
