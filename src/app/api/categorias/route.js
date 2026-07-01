import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// GET /api/categorias — listar todas las categorías
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('categorias')
    .select('id, nombre, unidad_venta')
    .order('nombre')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/categorias — crear nueva categoría
export async function POST(request) {
  const body = await request.json()
  const { nombre, unidad_venta } = body
  const { data, error } = await supabaseAdmin
    .from('categorias')
    .insert([{ nombre, unidad_venta }])
    .select('id, nombre, unidad_venta')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
