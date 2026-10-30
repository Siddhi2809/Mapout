import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const rawMaterials = await prisma.rawMaterial.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: rawMaterials });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch raw materials' },
      { status: 500 }
    );
  }
}

function sanitizeStr(val: any, fallback: string = ''): string {
  if (typeof val !== 'string') return fallback;
  // Strip null bytes and non-printable control characters that break UTF-8 in PostgreSQL
  return val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim() || fallback;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cleanSku = sanitizeStr(body.sku);
    const cleanName = sanitizeStr(body.name);

    if (!cleanSku || !cleanName) {
      return NextResponse.json(
        { success: false, message: 'Invalid material code or name. Ensure valid text without corrupted bytes.' },
        { status: 400 }
      );
    }

    const newMaterial = await prisma.rawMaterial.create({
      data: {
        materialCode: sanitizeStr(body.materialCode) || undefined,
        name: cleanName,
        sku: cleanSku,
        category: sanitizeStr(body.category, 'Connectors'),
        unit: sanitizeStr(body.unit, 'PCS'),
        currentStock: parseFloat(body.currentStock || 0),
        minStock: parseFloat(body.minStock || 0),
        maxStock: body.maxStock ? parseFloat(body.maxStock) : null,
        unitCost: parseFloat(body.unitCost || 0),
        supplierId: sanitizeStr(body.supplierId) || null,
        supplierName: sanitizeStr(body.supplierName, 'Unassigned'),
        location: sanitizeStr(body.location, 'Rack A-01'),
        description: sanitizeStr(body.description),
        status: body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      },
    });
    return NextResponse.json({ success: true, data: newMaterial }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create raw material' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const sku = searchParams.get('sku');

    if (!id && !sku) {
      return NextResponse.json({ success: false, message: 'ID or SKU is required for deletion' }, { status: 400 });
    }

    // Attempt to delete by ID or SKU
    const existing = await prisma.rawMaterial.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(sku ? [{ sku }] : []),
        ],
      },
    });

    if (!existing) {
      return NextResponse.json({ success: true, message: 'Item already removed or not found in database' });
    }

    await prisma.rawMaterial.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: 'Raw material deleted successfully from database' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete raw material' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // 1. Handle Batch Deductions (Used when production consumes raw materials)
    if (Array.isArray(body.deductions)) {
      const results: any[] = [];
      for (const item of body.deductions) {
        const itemQty = parseFloat(item.quantity || 0);
        if (itemQty <= 0) continue;

        const targetId = item.rawMaterialId || item.id;
        const targetSku = item.sku;

        const rm = await prisma.rawMaterial.findFirst({
          where: {
            OR: [
              ...(targetId ? [{ id: targetId }] : []),
              ...(targetId ? [{ sku: targetId }] : []),
              ...(targetSku ? [{ sku: targetSku }] : []),
              ...(item.rawMaterialName ? [{ name: item.rawMaterialName }] : []),
            ],
          },
        });

        if (rm) {
          const prevStock = rm.currentStock;
          const newStock = Math.max(0, prevStock - itemQty);
          const updatedRm = await prisma.rawMaterial.update({
            where: { id: rm.id },
            data: { currentStock: newStock },
          });
          results.push({
            id: updatedRm.id,
            name: updatedRm.name,
            sku: updatedRm.sku,
            unit: updatedRm.unit,
            deducted: itemQty,
            previousStock: prevStock,
            updatedStock: newStock,
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully deducted raw materials from stock.`,
        data: results,
      });
    }

    const { id, sku, materialCode, ...data } = body;
    if (!id && !sku && !materialCode) {
      return NextResponse.json({ success: false, message: 'ID or SKU is required for update' }, { status: 400 });
    }

    const existing = await prisma.rawMaterial.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(id ? [{ sku: id }] : []),
          ...(sku ? [{ sku }] : []),
          ...(sku ? [{ id: sku }] : []),
          ...(materialCode ? [{ materialCode }] : []),
          ...(data.sku ? [{ sku: data.sku }] : []),
        ],
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Raw material not found in database' }, { status: 404 });
    }

    // Direct single deduction
    if (body.deductQuantity !== undefined) {
      const deductQty = parseFloat(body.deductQuantity || 0);
      const prevStock = existing.currentStock;
      const newStock = Math.max(0, prevStock - deductQty);
      const updated = await prisma.rawMaterial.update({
        where: { id: existing.id },
        data: { currentStock: newStock },
      });
      return NextResponse.json({
        success: true,
        data: updated,
        previousStock: prevStock,
        updatedStock: newStock,
      });
    }

    const updated = await prisma.rawMaterial.update({
      where: { id: existing.id },
      data: {
        ...(data.name && { name: sanitizeStr(data.name) }),
        ...(data.sku && { sku: sanitizeStr(data.sku) }),
        ...(data.category && { category: sanitizeStr(data.category) }),
        ...(data.unit && { unit: sanitizeStr(data.unit) }),
        ...(data.currentStock !== undefined && { currentStock: parseFloat(data.currentStock) }),
        ...(data.minStock !== undefined && { minStock: parseFloat(data.minStock) }),
        ...(data.maxStock !== undefined && { maxStock: data.maxStock ? parseFloat(data.maxStock) : null }),
        ...(data.unitCost !== undefined && { unitCost: parseFloat(data.unitCost) }),
        ...(data.supplierId !== undefined && { supplierId: sanitizeStr(data.supplierId) || null }),
        ...(data.supplierName !== undefined && { supplierName: sanitizeStr(data.supplierName) }),
        ...(data.location !== undefined && { location: sanitizeStr(data.location) }),
        ...(data.description !== undefined && { description: sanitizeStr(data.description) }),
        ...(data.status && { status: data.status }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update raw material' },
      { status: 500 }
    );
  }
}
