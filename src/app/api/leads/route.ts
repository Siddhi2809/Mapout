import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: leads });
  } catch (error: any) {
    // Fallback to raw query if needed
    try {
      const rawLeads: any[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM "Lead" ORDER BY "createdAt" DESC`
      );
      return NextResponse.json({ success: true, data: rawLeads });
    } catch (e: any) {
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch leads' },
        { status: 500 }
      );
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const leadNumber = body.leadNumber || `LD-${Date.now().toString().slice(-5)}`;

    try {
      const newLead = await prisma.lead.create({
        data: {
          leadNumber,
          leadName: body.leadName || body.contactPerson || '',
          companyName: body.companyName || null,
          contactPerson: body.contactPerson || null,
          mobile: body.mobile || null,
          alternateMobile: body.alternateMobile || null,
          email: body.email || null,
          address: body.address || null,
          city: body.city || null,
          state: body.state || null,
          pincode: body.pincode || null,
          gstin: body.gstin || null,
          industry: body.industry || null,
          source: body.source || 'Website',
          salesperson: body.salesperson || body.assignedUser || null,
          website: body.website || null,
          requirement: body.requirement || null,
          interestedProductId: body.interestedProductId || null,
          interestedProductName: body.interestedProductName || null,
          expectedValue: parseFloat(body.expectedValue || 0),
          assignedUser: body.assignedUser || body.salesperson || 'Sales Team',
          status: body.status || 'New',
          nextFollowUpDate: body.nextFollowUpDate || null,
          notes: body.notes || null,
          importId: body.importId || null,
          convertedCustomerId: body.convertedCustomerId || null,
        },
      });
      return NextResponse.json({ success: true, data: newLead }, { status: 201 });
    } catch (prismaErr) {
      // Fallback SQL insert if Prisma Client types are stale
      const id = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Lead" (
          "id", "leadNumber", "leadName", "companyName", "contactPerson", "mobile", "alternateMobile",
          "email", "address", "city", "state", "pincode", "gstin", "industry", "source", "salesperson",
          "website", "requirement", "interestedProductId", "interestedProductName", "expectedValue",
          "assignedUser", "status", "nextFollowUpDate", "notes", "importId", "convertedCustomerId",
          "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, NOW(), NOW()
        )`,
        id,
        leadNumber,
        body.leadName || null,
        body.companyName || null,
        body.contactPerson || null,
        body.mobile || null,
        body.alternateMobile || null,
        body.email || null,
        body.address || null,
        body.city || null,
        body.state || null,
        body.pincode || null,
        body.gstin || null,
        body.industry || null,
        body.source || 'Website',
        body.salesperson || body.assignedUser || null,
        body.website || null,
        body.requirement || null,
        body.interestedProductId || null,
        body.interestedProductName || null,
        parseFloat(body.expectedValue || 0),
        body.assignedUser || body.salesperson || 'Sales Team',
        body.status || 'New',
        body.nextFollowUpDate || null,
        body.notes || null,
        body.importId || null,
        body.convertedCustomerId || null
      );
      const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "Lead" WHERE id = $1`, id);
      return NextResponse.json({ success: true, data: rows[0] || { id, ...body, leadNumber } }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create lead' },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing lead ID' }, { status: 400 });
    }

    try {
      const updated = await prisma.lead.update({
        where: { id },
        data: {
          ...updates,
          expectedValue: updates.expectedValue !== undefined ? parseFloat(updates.expectedValue) : undefined,
        },
      });
      return NextResponse.json({ success: true, data: updated });
    } catch {
      // Fallback SQL dynamic update
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      Object.entries(updates).forEach(([key, val]) => {
        if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
          fields.push(`"${key}" = $${idx}`);
          values.push(val);
          idx++;
        }
      });

      if (fields.length > 0) {
        fields.push(`"updatedAt" = NOW()`);
        values.push(id);
        const query = `UPDATE "Lead" SET ${fields.join(', ')} WHERE id = $${idx}`;
        await prisma.$executeRawUnsafe(query, ...values);
      }

      const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "Lead" WHERE id = $1`, id);
      return NextResponse.json({ success: true, data: rows[0] || { id, ...updates } });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update lead' },
      { status: 400 }
    );
  }
}
