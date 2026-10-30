import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const rawTasks: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "AdminTask" ORDER BY "createdAt" DESC`
    );
    return NextResponse.json({ success: true, data: rawTasks });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch tasks', data: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body.id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    await prisma.$executeRawUnsafe(
      `INSERT INTO "AdminTask" ("id", "task", "assignedTeam", "assignedUser", "priority", "dueDate", "status", "notes", "createdBy", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamp, $11::timestamp)`,
      id,
      body.task || 'Untitled Task',
      body.assignedTeam || 'Sales Team',
      body.assignedUser || 'Sales Manager',
      body.priority || 'Medium',
      body.dueDate || new Date().toISOString().split('T')[0],
      body.status || 'Pending',
      body.notes || '',
      body.createdBy || 'Admin',
      now,
      now
    );

    return NextResponse.json({ success: true, data: { id, ...body, createdAt: now, updatedAt: now } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create task' },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, task, assignedTeam, assignedUser, priority, dueDate, status, notes } = body;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing task ID' }, { status: 400 });
    }
    const now = new Date().toISOString();

    await prisma.$executeRawUnsafe(
      `UPDATE "AdminTask"
       SET "task" = COALESCE($2, "task"),
           "assignedTeam" = COALESCE($3, "assignedTeam"),
           "assignedUser" = COALESCE($4, "assignedUser"),
           "priority" = COALESCE($5, "priority"),
           "dueDate" = COALESCE($6, "dueDate"),
           "status" = COALESCE($7, "status"),
           "notes" = COALESCE($8, "notes"),
           "updatedAt" = $9::timestamp
       WHERE "id" = $1`,
      id,
      task || null,
      assignedTeam || null,
      assignedUser || null,
      priority || null,
      dueDate || null,
      status || null,
      notes || null,
      now
    );

    return NextResponse.json({ success: true, message: 'Task updated successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update task' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing task ID' }, { status: 400 });
    }

    await prisma.$executeRawUnsafe(`DELETE FROM "AdminTask" WHERE "id" = $1`, id);
    return NextResponse.json({ success: true, message: 'Task deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete task' },
      { status: 400 }
    );
  }
}
