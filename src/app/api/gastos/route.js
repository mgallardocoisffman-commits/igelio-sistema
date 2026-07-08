import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const sede = searchParams.get('sede')

  let query = supabaseAdmin
      .from('gastos')
      .select('*')
      .order('fecha', { ascending: false })

  if (desde) query = query.gte('fecha', desde)
    if (hasta) query = query.lte('fecha', hasta)
    if (sede) query = query.eq('sede', sede)

  const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function POST(request) {
    const body = await request.json()
    const { data, error } = await supabaseAdmin
      .from('gastos')
      .insert([body])
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
}

// DELETE /api/gastos — eliminar un gasto, protegido con la misma contraseña especial que ventas
export async function DELETE(request) {
    const body = await request.json()
    const { id, password } = body

  if (!password || password !== process.env.DELETE_SALE_PASSWORD) {
        return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }
    if (!id) {
          return NextResponse.json({ error: 'Falta el id del gasto' }, { status: 400 })
    }

  const { error } = await supabaseAdmin.from('gastos').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
}

// padding
