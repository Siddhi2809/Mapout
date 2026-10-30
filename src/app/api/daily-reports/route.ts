import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Ensure the DailyReport table exists in PostgreSQL
let isTableReady = false;
async function ensureDailyReportTable() {
  if (isTableReady) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DailyReport" (
        "id" TEXT PRIMARY KEY,
        "employeeName" TEXT NOT NULL,
        "date" TEXT NOT NULL,
        "work" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    isTableReady = true;
  } catch (err) {
    console.error('Error ensuring DailyReport table exists:', err);
  }
}

export async function GET(request: Request) {
  try {
    await ensureDailyReportTable();
    const { searchParams } = new URL(request.url);
    const employeeName = searchParams.get('employeeName');
    const date = searchParams.get('date');

    let query = `SELECT "id", "employeeName", "date", "work", "createdAt" FROM "DailyReport" WHERE 1=1`;
    const params: any[] = [];

    if (employeeName && employeeName.trim()) {
      params.push(`%${employeeName.trim()}%`);
      query += ` AND "employeeName" ILIKE $${params.length}`;
    }

    if (date && date.trim()) {
      params.push(date.trim());
      query += ` AND "date" = $${params.length}`;
    }

    query += ` ORDER BY "date" DESC, "createdAt" DESC`;

    const reports: any[] = await prisma.$queryRawUnsafe(query, ...params);
    return NextResponse.json({ success: true, data: reports });
  } catch (error: any) {
    console.error('Failed to fetch daily reports:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch daily reports', data: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureDailyReportTable();
    const body = await request.json();
    const { employeeName, date, work } = body;

    if (!employeeName || !String(employeeName).trim()) {
      return NextResponse.json(
        { success: false, message: 'Employee name is required' },
        { status: 400 }
      );
    }

    if (!date || !String(date).trim()) {
      return NextResponse.json(
        { success: false, message: 'Date is required' },
        { status: 400 }
      );
    }

    if (!work || !String(work).trim()) {
      return NextResponse.json(
        { success: false, message: 'Work description is required' },
        { status: 400 }
      );
    }

    const id = `report_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    await prisma.$executeRawUnsafe(
      `INSERT INTO "DailyReport" ("id", "employeeName", "date", "work", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5::timestamp, $6::timestamp)`,
      id,
      String(employeeName).trim(),
      String(date).trim(),
      String(work).trim(),
      now,
      now
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Daily report submitted successfully',
        data: {
          id,
          employeeName: String(employeeName).trim(),
          date: String(date).trim(),
          work: String(work).trim(),
          createdAt: now,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to save daily report:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit daily report' },
      { status: 500 }
    );
  }
}
