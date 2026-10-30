import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const rawMeetings: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Meeting" ORDER BY "date" ASC, "time" ASC`
    );
    return NextResponse.json({ success: true, data: rawMeetings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch meetings', data: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body.id || `meet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    await prisma.$executeRawUnsafe(
      `INSERT INTO "Meeting" ("id", "title", "meetingType", "participantId", "participantName", "assignedUser", "date", "time", "status", "location", "meetLink", "notes", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::timestamp, $14::timestamp)`,
      id,
      body.title || 'Client Meeting',
      body.meetingType || 'Customer',
      body.participantId || null,
      body.participantName || 'Client',
      body.assignedUser || 'Admin',
      body.date || new Date().toISOString().split('T')[0],
      body.time || '10:00 AM',
      body.status || 'Scheduled',
      body.location || '',
      body.meetLink || '',
      body.notes || '',
      now,
      now
    );

    return NextResponse.json({ success: true, data: { id, ...body, createdAt: now, updatedAt: now } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create meeting' },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, meetingType, participantName, assignedUser, date, time, status, location, meetLink, notes } = body;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing meeting ID' }, { status: 400 });
    }
    const now = new Date().toISOString();

    await prisma.$executeRawUnsafe(
      `UPDATE "Meeting" 
       SET "title" = COALESCE($2, "title"),
           "meetingType" = COALESCE($3, "meetingType"),
           "participantName" = COALESCE($4, "participantName"),
           "assignedUser" = COALESCE($5, "assignedUser"),
           "date" = COALESCE($6, "date"),
           "time" = COALESCE($7, "time"),
           "status" = COALESCE($8, "status"),
           "location" = COALESCE($9, "location"),
           "meetLink" = COALESCE($10, "meetLink"),
           "notes" = COALESCE($11, "notes"),
           "updatedAt" = $12::timestamp
       WHERE "id" = $1`,
      id,
      title || null,
      meetingType || null,
      participantName || null,
      assignedUser || null,
      date || null,
      time || null,
      status || null,
      location || null,
      meetLink || null,
      notes || null,
      now
    );

    return NextResponse.json({ success: true, message: 'Meeting updated successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update meeting' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing meeting ID' }, { status: 400 });
    }

    await prisma.$executeRawUnsafe(`DELETE FROM "Meeting" WHERE "id" = $1`, id);
    return NextResponse.json({ success: true, message: 'Meeting deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete meeting' },
      { status: 400 }
    );
  }
}
