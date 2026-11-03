import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shouldReset = searchParams.get('reset') === 'true';

    // Manual reset requested via query parameter
    if (shouldReset) {
      try {
        await prisma.lead.deleteMany({});
      } catch {
        await prisma.$executeRawUnsafe(`DELETE FROM "Lead";`);
      }
      try {
        await prisma.leadImportHistory.deleteMany({});
      } catch {
        await prisma.$executeRawUnsafe(`DELETE FROM "LeadImportHistory";`);
      }
    }

    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: leads });
  } catch (error: any) {
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
    const leadNumber = body.leadNumber || `LD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const id = body.id || `lead-${Date.now().toString().slice(-4)}`;

    try {
      const newLead = await prisma.lead.create({
        data: {
          id,
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
          contactDate: body.contactDate || null,
          contactTime: body.contactTime || null,
          nextFollowUpDate: body.nextFollowUpDate || null,
          notes: body.notes || null,
          importId: body.importId || null,
          convertedCustomerId: body.convertedCustomerId || null,
        },
      });
      return NextResponse.json({ success: true, data: newLead }, { status: 201 });
    } catch (prismaErr) {
      // Fallback SQL insert if Prisma Client types are stale
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Lead" (
          "id", "leadNumber", "leadName", "companyName", "contactPerson", "mobile", "alternateMobile",
          "email", "address", "city", "state", "pincode", "gstin", "industry", "source", "salesperson",
          "website", "requirement", "interestedProductId", "interestedProductName", "expectedValue",
          "assignedUser", "status", "contactDate", "contactTime", "nextFollowUpDate", "notes", "importId", "convertedCustomerId",
          "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, NOW(), NOW()
        ) ON CONFLICT ("leadNumber") DO UPDATE SET "updatedAt" = NOW()`,
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
        body.contactDate || null,
        body.contactTime || null,
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
    const id = body.id;
    const leadNumber = body.leadNumber;

    if (!id && !leadNumber) {
      return NextResponse.json({ success: false, message: 'Missing lead ID or lead number' }, { status: 400 });
    }

    // Clean data matching schema
    const cleanData: any = {};
    const textFields = [
      'leadName', 'companyName', 'contactPerson', 'mobile', 'alternateMobile',
      'email', 'address', 'city', 'state', 'pincode', 'gstin', 'industry',
      'source', 'salesperson', 'website', 'requirement', 'interestedProductId',
      'interestedProductName', 'assignedUser', 'status', 'contactDate', 'contactTime', 'nextFollowUpDate',
      'notes', 'importId', 'convertedCustomerId'
    ];

    textFields.forEach((field) => {
      if (body[field] !== undefined) {
        cleanData[field] = body[field] === null ? null : String(body[field]).trim();
      }
    });

    if (body.expectedValue !== undefined) {
      cleanData.expectedValue = parseFloat(body.expectedValue) || 0;
    }

    // Locate existing lead in database by id or leadNumber
    let target: any = null;
    if (id) {
      target = await prisma.lead.findUnique({ where: { id } }).catch(() => null);
      if (!target) {
        target = await prisma.lead.findFirst({
          where: { OR: [{ id }, { leadNumber: id }] }
        }).catch(() => null);
      }
    }
    if (!target && leadNumber) {
      target = await prisma.lead.findUnique({ where: { leadNumber } }).catch(() => null);
      if (!target) {
        target = await prisma.lead.findFirst({
          where: { OR: [{ leadNumber }, { id: leadNumber }] }
        }).catch(() => null);
      }
    }
    if (!target && (cleanData.mobile || cleanData.email)) {
      target = await prisma.lead.findFirst({
        where: {
          OR: [
            cleanData.mobile ? { mobile: cleanData.mobile } : {},
            cleanData.email ? { email: cleanData.email } : {},
          ].filter(o => Object.keys(o).length > 0)
        }
      }).catch(() => null);
    }

    if (target) {
      try {
        const updated = await prisma.lead.update({
          where: { id: target.id },
          data: cleanData,
        });
        return NextResponse.json({ success: true, data: updated });
      } catch (prismaUpdateErr) {
        // Fallback SQL update by target.id
        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        Object.entries(cleanData).forEach(([key, val]) => {
          fields.push(`"${key}" = $${idx}`);
          values.push(val);
          idx++;
        });

        if (fields.length > 0) {
          fields.push(`"updatedAt" = NOW()`);
          values.push(target.id);
          const query = `UPDATE "Lead" SET ${fields.join(', ')} WHERE id = $${idx}`;
          await prisma.$executeRawUnsafe(query, ...values);
        }

        const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "Lead" WHERE id = $1`, target.id);
        return NextResponse.json({ success: true, data: rows[0] || { ...target, ...cleanData } });
      }
    } else {
      // Upsert: lead not found in DB, insert it with all details
      const finalId = id || `lead-${Date.now().toString().slice(-4)}`;
      const finalLeadNumber = leadNumber || `LD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

      try {
        const created = await prisma.lead.create({
          data: {
            id: finalId,
            leadNumber: finalLeadNumber,
            ...cleanData,
          }
        });
        return NextResponse.json({ success: true, data: created });
      } catch (createErr) {
        const fields = ['id', 'leadNumber', ...Object.keys(cleanData)];
        const placeholders = fields.map((_, i) => `$${i + 1}`);
        const values = [finalId, finalLeadNumber, ...Object.values(cleanData)];
        const insertQuery = `INSERT INTO "Lead" (${fields.map(f => `"${f}"`).join(', ')}, "createdAt", "updatedAt") VALUES (${placeholders.join(', ')}, NOW(), NOW()) ON CONFLICT ("leadNumber") DO UPDATE SET "updatedAt" = NOW()`;
        await prisma.$executeRawUnsafe(insertQuery, ...values);
        const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "Lead" WHERE id = $1 OR "leadNumber" = $2`, finalId, finalLeadNumber);
        return NextResponse.json({ success: true, data: rows[0] || { id: finalId, leadNumber: finalLeadNumber, ...cleanData } });
      }
    }
  } catch (error: any) {
    console.error('Lead PUT error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update lead' },
      { status: 400 }
    );
  }
}


export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all');

    if (all === 'true' || all === 'all') {
      try {
        await prisma.lead.deleteMany({});
      } catch {
        await prisma.$executeRawUnsafe(`DELETE FROM "Lead";`);
      }
      try {
        await prisma.leadImportHistory.deleteMany({});
      } catch {
        await prisma.$executeRawUnsafe(`DELETE FROM "LeadImportHistory";`);
      }
      return NextResponse.json({ success: true, message: 'All leads and import histories cleared from database.' });
    }

    if (id) {
      try {
        await prisma.lead.delete({
          where: { id },
        });
      } catch {
        await prisma.$executeRawUnsafe(`DELETE FROM "Lead" WHERE id = $1 OR "leadNumber" = $1`, id);
      }
      return NextResponse.json({ success: true, message: `Lead ${id} deleted successfully.` });
    }

    return NextResponse.json({ success: false, message: 'Missing lead ID or all=true' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete lead' },
      { status: 400 }
    );
  }
}
