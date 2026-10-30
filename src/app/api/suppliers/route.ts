import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newSupplier = await prisma.supplier.create({
      data: {
        supplierCode: body.supplierCode,
        name: body.name,
        companyName: body.companyName,
        contactPerson: body.contactPerson,
        email: body.email,
        phone: body.phone,
        gstNumber: body.gstNumber,
        address: body.address,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        category: body.category || 'Raw Components',
        totalPurchase: parseFloat(body.totalPurchase || 0),
        totalOutstanding: parseFloat(body.totalOutstanding || 0),
        paymentTerms: body.paymentTerms || 'Net 30 Days',
        bankName: body.bankName,
        accountNumber: body.accountNumber,
        ifscCode: body.ifscCode,
        branchName: body.branchName,
        accountHolderName: body.accountHolderName,
        status: body.status || 'ACTIVE',
      },
    });
    return NextResponse.json({ success: true, data: newSupplier }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create supplier' },
      { status: 400 }
    );
  }
}
