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

    // Check if bulk batch array was sent
    if (Array.isArray(body)) {
      const recordsToInsert = body.map((c: any, idx: number) => ({
        customerCode: c.customerCode || c.customerNumber || `CUS-${101 + idx}`,
        name: c.name || c.companyName || 'Valued Customer',
        companyName: c.companyName || c.name || 'Valued Customer',
        customerType: c.customerType || c.category || 'Distributor',
        contactPerson: c.contactPerson || c.name || 'Contact Person',
        mobile: c.mobile || '',
        alternateMobile: c.alternateMobile || '',
        email: c.email || '',
        gstNumber: c.gstNumber || '',
        panNumber: c.panNumber || '',
        gstType: c.gstType || (c.gstNumber ? 'Regular' : 'Unregistered'),
        address: c.address || '',
        city: c.city || '',
        state: c.state || '',
        pincode: c.pincode || '',
        country: c.country || (c.city || c.state ? 'India' : ''),
        category: c.category || c.customerType || 'Distributor',
        paymentTerms: c.paymentTerms || '',
        creditLimit: parseFloat(c.creditLimit || 0),
        assignedSalesUser: c.assignedSalesUser || '',
        status: c.status || 'ACTIVE',
      }));

      // Use Prisma createMany for high-speed bulk insertion
      await prisma.customer.createMany({
        data: recordsToInsert,
        skipDuplicates: true,
      });

      return NextResponse.json({
        success: true,
        message: `Successfully imported ${recordsToInsert.length} customers into database`,
        count: recordsToInsert.length,
      });
    }

    const newCustomer = await prisma.customer.create({
      data: {
        customerCode: body.customerCode || body.customerNumber,
        name: body.name || body.companyName,
        companyName: body.companyName || body.name,
        customerType: body.customerType || 'Distributor',
        contactPerson: body.contactPerson || body.name || 'Contact Person',
        mobile: body.mobile || '',
        alternateMobile: body.alternateMobile || '',
        email: body.email || '',
        gstNumber: body.gstNumber || '',
        panNumber: body.panNumber || '',
        gstType: body.gstType || 'Regular',
        address: body.address || '',
        city: body.city || '',
        state: body.state || '',
        pincode: body.pincode || '',
        country: body.country || 'India',
        category: body.category || 'Distributor',
        paymentTerms: body.paymentTerms || '',
        creditLimit: parseFloat(body.creditLimit || 0),
        assignedSalesUser: body.assignedSalesUser || '',
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

