import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

const TIPO_CAMBIO = 3.411

// POST /api/importaciones/integrar - crea productos en Inventario a partir de los
// items de un lote que aun no esten vinculados, usando el costo puesto en deposito
// prorrateado por peso.
export async function POST(request) {
    const body = await request.json()
    const { lote_id, categoria_id } = body

  if (!lote_id || !categoria_id) {
        return NextResponse.json({ error: 'Falta lote_id o categoria_id' }, { status: 400 })
  }

  const { data: lote, error: loteError } = await supabaseAdmin
      .from('importaciones')
      .select('*, importacion_items(*)')
      .eq('id', lote_id)
      .single()

  if (loteError || !lote) return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 })

  const { costo_flete_usd, costo_aduanas_usd, costo_transporte_local_usd } = lote
    if (costo_flete_usd == null || costo_aduanas_usd == null || costo_transporte_local_usd == null) {
          return NextResponse.json({ error: 'Faltan costos logisticos por completar en el lote' }, { status: 400 })
    }

  const pendientes = (lote.importacion_items || []).filter(i => !i.producto_id)
    if (pendientes.length === 0) {
          return NextResponse.json({ error: 'Todos los items de este lote ya estan integrados al inventario' }, { status: 400 })
    }

  const totalCompra = (lote.importacion_items || []).reduce((s, i) => s + i.precio_compra_unit_usd * i.cantidad, 0)
    const logisticaTotal = costo_flete_usd + costo_aduanas_usd + costo_transporte_local_usd

  const { data: maxProd } = await supabaseAdmin
      .from('productos')
      .select('codigo_legacy')
      .order('codigo_legacy', { ascending: false })
      .limit(1)
      .single()
    let nextCodigo = (maxProd?.codigo_legacy || 0) + 1

  const creados = []
      for (const item of pendientes) {
            const totalItemUsd = item.precio_compra_unit_usd * item.cantidad
            const peso = totalCompra > 0 ? totalItemUsd / totalCompra : 0
            const puestoDepoUsdUnit = (totalItemUsd + logisticaTotal * peso) / item.cantidad

      const { data: nuevoProducto, error: prodError } = await supabaseAdmin
              .from('productos')
              .insert([{
                        codigo_legacy: nextCodigo,
                        categoria_id,
                        descripcion: item.descripcion,
                        stock: item.cantidad,
                        stock_minimo: 1,
                        precio_compra: Math.round(item.precio_compra_unit_usd * TIPO_CAMBIO * 100) / 100,
                        precio_puesto_depo: Math.round(puestoDepoUsdUnit * TIPO_CAMBIO * 100) / 100,
                        activo: true,
              }])
              .select()
              .single()

      if (prodError) return NextResponse.json({ error: prodError.message }, { status: 500 })

      await supabaseAdmin
              .from('importacion_items')
              .update({ producto_id: nuevoProducto.id })
              .eq('id', item.id)

      creados.push(nuevoProducto)
            nextCodigo++
      }

  await supabaseAdmin.from('importaciones').update({ estado: 'en_inventario' }).eq('id', lote_id)

  return NextResponse.json({ ok: true, creados: creados.length }, { status: 201 })
}
