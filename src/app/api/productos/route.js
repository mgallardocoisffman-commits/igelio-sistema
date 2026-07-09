import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// GET /api/productos - listar todos los productos con su categoria
export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')
    const search = searchParams.get('search')

  let query = supabaseAdmin
      .from('productos')
      .select('*, categorias(nombre, unidad_venta)')
      .eq('activo', true)
      .order('codigo_legacy')

  if (categoria) query = query.eq('categorias.nombre', categoria)
    if (search) query = query.ilike('descripcion', `%${search}%`)

  const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

// POST /api/productos - crear nuevo producto
export async function POST(request) {
    const body = await request.json()
    const { data, error } = await supabaseAdmin
      .from('productos')
      .insert([body])
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
}

// PUT /api/productos - actualizar producto
export async function PUT(request) {
    const body = await request.json()
    const { id, ...updates } = body
    const { data, error } = await supabaseAdmin
      .from('productos')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

// DELETE /api/productos - eliminar producto, protegido con la contrasena especial
export async function DELETE(request) {
    const body = await request.json()
    const { id, password } = body

  if (!password || password !== process.env.DELETE_SALE_PASSWORD) {
        return NextResponse.json({ error: 'Contrasena incorrecta' }, { status: 401 })
  }
    if (!id) {
          return NextResponse.json({ error: 'Falta el id del producto' }, { status: 400 })
    }

  const { error } = await supabaseAdmin.from('productos').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
}
