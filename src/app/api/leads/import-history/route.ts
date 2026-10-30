import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const history = await prisma.$queryRawUnsafe(
      `SELECT * FROM "LeadImportHistory" ORDER BY "createdAt" DESC`
    );
    return NextResponse.json({ success: true, data: history });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch import history' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body.id || `imp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await prisma.$executeRawUnsafe(
      `INSERT INTO "LeadImportHistory" (
        "id", "fileName", "importedBy", "importDate", "totalRows", "newLeads", 
        "updatedLeads", "duplicateLeads", "failedRows", "status", "errorReport", "createdAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
      id,
      body.fileName || 'leads_import.xlsx',
      body.importedBy || 'Sales Person',
      body.importDate || new Date().toISOString().split('T')[0],
      parseInt(body.totalRows || 0, 10),
      parseInt(body.newLeads || 0, 10),
      parseInt(body.updatedLeads || 0, 10),
      parseInt(body.duplicateLeads || 0, 10),
      parseInt(body.failedRows || 0, 10),
      body.status || 'Completed',
      typeof body.errorReport === 'object' ? JSON.stringify(body.errorReport) : body.errorReport || null
    );

    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "LeadImportHistory" WHERE id = $1`,
      id
    );

    return NextResponse.json({ success: true, data: rows[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to record import history' },
      { status: 400 }
    );
  }
}
