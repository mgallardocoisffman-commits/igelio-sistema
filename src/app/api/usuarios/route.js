import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .select('id, nombre, email, rol, sede, activo, creado_en')
    .order('nombre')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request) {
  const body = await request.json()
  const { nombre, email, password, rol, sede } = body
  const password_hash = await bcrypt.hash(password, 10)
  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .insert([{ nombre, email, password_hash, rol, sede }])
    .select('id, nombre, email, rol, sede')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(request) {
  const body = await request.json()
  const { id, password, ...updates } = body
  if (password) updates.password_hash = await bcrypt.hash(password, 10)
  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .update(updates)
    .eq('id', id)
    .select('id, nombre, email, rol, sede')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const { error } = await supabaseAdmin
    .from('usuarios')
    .update({ activo: false })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
