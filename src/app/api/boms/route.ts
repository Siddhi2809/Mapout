import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const boms = await prisma.bOM.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: boms });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch BOMs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newBOM = await prisma.bOM.create({
      data: {
        bomNumber: body.bomNumber || `BOM-${Date.now()}`,
        productId: body.productId,
        productName: body.productName,
        version: body.version || 1,
        status: body.status || 'Active',
        createdDate: body.createdDate || new Date().toISOString().split('T')[0],
        createdBy: body.createdBy || 'Admin',
        items: {
          create: (body.items || []).map((i: any) => ({
            rawMaterialId: i.rawMaterialId,
            rawMaterialName: i.rawMaterialName,
            sku: i.sku || '',
            unit: i.unit || 'PCS',
            quantity: Number(i.quantity || 1),
            wastagePercent: Number(i.wastagePercent || 0),
            notes: i.notes || '',
          })),
        },
      },
      include: { items: true },
    });
    return NextResponse.json({ success: true, data: newBOM }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create BOM' },
      { status: 400 }
    );
  }
}
