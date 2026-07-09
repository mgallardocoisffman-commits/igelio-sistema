import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
    const { data, error } = await supabaseAdmin
      .from('importaciones')
      .select('*, importacion_items(*)')
      .order('creado_en', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

// PUT /api/importaciones - actualizar el lote, o un item individual si se envia item_id
export async function PUT(request) {
    const body = await request.json()

  if (body.item_id) {
        const { item_id, ...updates } = body
        const { data, error } = await supabaseAdmin
          .from('importacion_items')
          .update(updates)
          .eq('id', item_id)
          .select()
          .single()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
  }

  const { id, ...updates } = body
    const { data, error } = await supabaseAdmin
      .from('importaciones')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}
