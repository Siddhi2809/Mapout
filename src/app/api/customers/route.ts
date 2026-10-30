import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: customers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newCustomer = await prisma.customer.create({
      data: {
        customerCode: body.customerCode,
        name: body.name,
        companyName: body.companyName,
        customerType: body.customerType || 'Distributor',
        contactPerson: body.contactPerson || body.name || 'Contact Person',
        mobile: body.mobile,
        alternateMobile: body.alternateMobile,
        email: body.email,
        gstNumber: body.gstNumber,
        panNumber: body.panNumber,
        gstType: body.gstType || 'Regular',
        address: body.address,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        country: body.country || 'India',
        category: body.category || 'Distributor',
        paymentTerms: body.paymentTerms || 'Net 30 Days',
        creditLimit: parseFloat(body.creditLimit || 0),
        assignedSalesUser: body.assignedSalesUser,
        status: body.status || 'ACTIVE',
      },
    });
    return NextResponse.json({ success: true, data: newCustomer }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create customer' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      await prisma.customer.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'Customer deleted successfully' });
    } else {
      const res = await prisma.customer.deleteMany({});
      return NextResponse.json({
        success: true,
        message: 'All customer records deleted successfully',
        count: res.count,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete customer(s)' },
      { status: 500 }
    );
  }
}

