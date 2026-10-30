import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const rawLogs: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 200`
    );
    return NextResponse.json({ success: true, data: rawLogs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch audit logs', data: [] },
      { status: 500 }
    );
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body.id || `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    await prisma.$executeRawUnsafe(
      `INSERT INTO "AuditLog" ("id", "user", "role", "action", "module", "recordId", "previousValue", "newValue", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamp)`,
      id,
      body.user || 'Admin',
      body.role || 'ADMIN',
      body.action || 'Updated record',
      body.module || 'General',
      body.recordId || null,
      body.previousValue || null,
      body.newValue || null,
      now
    );
return NextResponse.json({ success: true, data: { id, ...body, createdAt: now } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to write audit log' },
      { status: 400 }
    );
  }
}
