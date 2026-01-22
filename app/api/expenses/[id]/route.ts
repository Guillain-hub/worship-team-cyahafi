import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ MUST await params in Next.js App Router
    const { id } = await context.params

    console.log('✏️ PATCH /api/expenses/:id - attempting to update:', id)

    if (!id) {
      return NextResponse.json(
        { error: 'Expense ID is required' },
        { status: 400 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { amount, reason, date } = body || {}

    console.log('Update data:', { amount, reason, date })

    const updates: any = {}
    if (typeof amount !== 'undefined') updates.amount = Number(amount)
    if (typeof reason !== 'undefined') updates.reason = reason
    if (typeof date !== 'undefined') updates.date = date

    const updated = await prisma.expense.update({
      where: { id },
      data: updates,
    })

    console.log('✅ Expense updated successfully:', id)
    return NextResponse.json({ success: true, expense: updated })
  } catch (error: any) {
    console.error('🚨 PATCH /api/expenses/:id error:', error.message || error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to update expense',
        details:
          process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ MUST await params in Next.js App Router
    const { id } = await context.params

    console.log('🗑️ DELETE /api/expenses/:id - attempting to delete:', id)

    if (!id) {
      return NextResponse.json(
        { error: 'Expense ID is required' },
        { status: 400 }
      )
    }

    // Check existence first
    const existing = await prisma.expense.findUnique({
      where: { id },
    })

    if (!existing) {
      console.log('Expense not found:', id)
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    await prisma.expense.delete({
      where: { id },
    })

    console.log('✅ Expense deleted successfully:', id)
    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    console.error('🚨 DELETE /api/expenses/:id error:', error.message || error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to delete expense',
        details:
          process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}
