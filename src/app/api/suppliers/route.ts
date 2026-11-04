import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function sanitizeStr(val: any, fallback: string = ''): string {
  if (typeof val !== 'string') return fallback;
  // Strip null bytes and non-printable control characters that break UTF-8 in PostgreSQL
  return val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim() || fallback;
}

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error: any) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const cleanName = sanitizeStr(body.name);
    if (!cleanName) {
      return NextResponse.json(
        { success: false, message: 'Supplier Name is required.' },
        { status: 400 }
      );
    }

    const supplierCode = sanitizeStr(body.supplierCode) || `SUP-${Date.now().toString().slice(-6)}`;
    const contactPerson = sanitizeStr(body.contactPerson) || cleanName || 'Accounts / Procurement';
    const email = sanitizeStr(body.email, 'vendor@example.com');
    const phone = sanitizeStr(body.phone, '+91 90000 00000');
    const address = sanitizeStr(body.address, 'Industrial Estate');
    const companyName = sanitizeStr(body.companyName) || cleanName;
    const category = sanitizeStr(body.category, 'Raw Components');
    const paymentTerms = sanitizeStr(body.paymentTerms, 'Net 30 Days');
    const totalPurchase = isNaN(parseFloat(body.totalPurchase)) ? 0 : parseFloat(body.totalPurchase);
    const totalOutstanding = isNaN(parseFloat(body.totalOutstanding)) ? 0 : parseFloat(body.totalOutstanding);

    // Upsert by supplierCode to prevent unique constraint crashes
    const supplier = await prisma.supplier.upsert({
      where: { supplierCode },
      update: {
        name: cleanName,
        companyName,
        contactPerson,
        email,
        phone,
        gstNumber: sanitizeStr(body.gstNumber) || null,
        address,
        city: sanitizeStr(body.city) || null,
        state: sanitizeStr(body.state) || null,
        pincode: sanitizeStr(body.pincode) || null,
        category,
        totalPurchase,
        totalOutstanding,
        paymentTerms,
        bankName: sanitizeStr(body.bankName) || null,
        accountNumber: sanitizeStr(body.accountNumber) || null,
        ifscCode: sanitizeStr(body.ifscCode) || null,
        branchName: sanitizeStr(body.branchName) || null,
        accountHolderName: sanitizeStr(body.accountHolderName) || null,
        status: body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      },
      create: {
        ...(body.id ? { id: String(body.id) } : {}),
        supplierCode,
        name: cleanName,
        companyName,
        contactPerson,
        email,
        phone,
        gstNumber: sanitizeStr(body.gstNumber) || null,
        address,
        city: sanitizeStr(body.city) || null,
        state: sanitizeStr(body.state) || null,
        pincode: sanitizeStr(body.pincode) || null,
        category,
        totalPurchase,
        totalOutstanding,
        paymentTerms,
        bankName: sanitizeStr(body.bankName) || null,
        accountNumber: sanitizeStr(body.accountNumber) || null,
        ifscCode: sanitizeStr(body.ifscCode) || null,
        branchName: sanitizeStr(body.branchName) || null,
        accountHolderName: sanitizeStr(body.accountHolderName) || null,
        status: body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      },
    });

    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating/saving supplier to DB:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create supplier' },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = sanitizeStr(body.id);
    const supplierCode = sanitizeStr(body.supplierCode);

    if (!id && !supplierCode) {
      return NextResponse.json(
        { success: false, message: 'Supplier ID or supplierCode is required for update' },
        { status: 400 }
      );
    }

    // Find the existing supplier
    const existing = await prisma.supplier.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(supplierCode ? [{ supplierCode }] : []),
        ],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Supplier not found in database' },
        { status: 404 }
      );
    }

    const updated = await prisma.supplier.update({
      where: { id: existing.id },
      data: {
        ...(body.name !== undefined && { name: sanitizeStr(body.name, existing.name) }),
        ...(body.companyName !== undefined && { companyName: sanitizeStr(body.companyName) || null }),
        ...(body.contactPerson !== undefined && {
          contactPerson: sanitizeStr(body.contactPerson) || existing.contactPerson || sanitizeStr(body.name) || 'Accounts / Procurement',
        }),
        ...(body.email !== undefined && { email: sanitizeStr(body.email, existing.email) }),
        ...(body.phone !== undefined && { phone: sanitizeStr(body.phone, existing.phone) }),
        ...(body.gstNumber !== undefined && { gstNumber: sanitizeStr(body.gstNumber) || null }),
        ...(body.address !== undefined && { address: sanitizeStr(body.address, existing.address) }),
        ...(body.city !== undefined && { city: sanitizeStr(body.city) || null }),
        ...(body.state !== undefined && { state: sanitizeStr(body.state) || null }),
        ...(body.pincode !== undefined && { pincode: sanitizeStr(body.pincode) || null }),
        ...(body.category !== undefined && { category: sanitizeStr(body.category, existing.category) }),
        ...(body.totalPurchase !== undefined && {
          totalPurchase: isNaN(parseFloat(body.totalPurchase)) ? existing.totalPurchase : parseFloat(body.totalPurchase),
        }),
        ...(body.totalOutstanding !== undefined && {
          totalOutstanding: isNaN(parseFloat(body.totalOutstanding)) ? existing.totalOutstanding : parseFloat(body.totalOutstanding),
        }),
        ...(body.paymentTerms !== undefined && { paymentTerms: sanitizeStr(body.paymentTerms, existing.paymentTerms) }),
        ...(body.bankName !== undefined && { bankName: sanitizeStr(body.bankName) || null }),
        ...(body.accountNumber !== undefined && { accountNumber: sanitizeStr(body.accountNumber) || null }),
        ...(body.ifscCode !== undefined && { ifscCode: sanitizeStr(body.ifscCode) || null }),
        ...(body.branchName !== undefined && { branchName: sanitizeStr(body.branchName) || null }),
        ...(body.accountHolderName !== undefined && { accountHolderName: sanitizeStr(body.accountHolderName) || null }),
        ...(body.status !== undefined && { status: body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating supplier in DB:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update supplier' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = sanitizeStr(searchParams.get('id'));
    let supplierCode = sanitizeStr(searchParams.get('supplierCode'));

    if (!id && !supplierCode) {
      try {
        const body = await request.json();
        id = sanitizeStr(body.id);
        supplierCode = sanitizeStr(body.supplierCode);
      } catch {
        // no body provided
      }
    }

    if (!id && !supplierCode) {
      return NextResponse.json(
        { success: false, message: 'Supplier ID or supplierCode is required for deletion' },
        { status: 400 }
      );
    }

    const existing = await prisma.supplier.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(supplierCode ? [{ supplierCode }] : []),
        ],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: true, message: 'Supplier already removed or not found' }
      );
    }

    await prisma.supplier.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: 'Supplier deleted successfully from database' });
  } catch (error: any) {
    console.error('Error deleting supplier from DB:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete supplier' },
      { status: 500 }
    );
  }
}
