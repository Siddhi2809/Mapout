import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.productMaster.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all BOMs with items to populate rawMaterialQuantities
    const boms = await prisma.bOM.findMany({
      include: { items: true },
    });

    const productsWithQuantities = products.map((p) => {
      let rawMaterialQuantities: any[] = [];
      if (p.rawMaterialQuantities) {
        try {
          rawMaterialQuantities = JSON.parse(p.rawMaterialQuantities);
        } catch {
          rawMaterialQuantities = [];
        }
      }

      if (!Array.isArray(rawMaterialQuantities) || rawMaterialQuantities.length === 0) {
        const activeBOM =
          boms.find((b) => b.productId === p.id && b.status === 'Active') ||
          boms.find((b) => b.productId === p.id) ||
          boms.find((b) => b.productName.toLowerCase() === p.name.toLowerCase());

        rawMaterialQuantities = activeBOM
          ? activeBOM.items.map((i) => ({
              rawMaterialId: i.rawMaterialId,
              rawMaterialName: i.rawMaterialName,
              sku: i.sku,
              unit: i.unit,
              quantityUsed: i.quantity,
              wastagePercent: i.wastagePercent,
              notes: i.notes || '',
            }))
          : [];
      }

      return {
        ...p,
        rawMaterialQuantities,
      };
    });

    return NextResponse.json({ success: true, data: productsWithQuantities });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rmQuantities = body.rawMaterialQuantities;

    const newProduct = await prisma.productMaster.create({
      data: {
        productCode: body.productCode,
        sku: body.sku,
        name: body.name,
        category: body.category,
        brand: body.brand,
        connectorType: body.connectorType,
        cableLengthWireSpec: body.cableLengthWireSpec,
        vehicleScannerCompatibility: body.vehicleScannerCompatibility,
        subcategory: body.subcategory,
        description: body.description,
        purchaseCost: parseFloat(body.purchaseCost || 0),
        sellingPrice: parseFloat(body.sellingPrice || 0),
        discount: parseFloat(body.discount || 0),
        gstPercent: parseFloat(body.gstPercent || 18),
        hsnSac: body.hsnSac,
        openingStock: parseFloat(body.openingStock || 0),
        currentStock: parseFloat(body.currentStock || body.openingStock || 0),
        minStock: parseFloat(body.minStock || 0),
        maxStock: parseFloat(body.maxStock || 1000),
        status: body.status || 'ACTIVE',
        imageUrl: body.imageUrl,
        rawMaterialQuantities: Array.isArray(rmQuantities) ? JSON.stringify(rmQuantities) : null,
      },
    });

    // Also mirror to FinishedGood model if not existing
    await prisma.finishedGood.create({
      data: {
        sku: newProduct.sku,
        name: newProduct.name,
        category: newProduct.category,
        currentStock: newProduct.currentStock,
        minStock: newProduct.minStock,
        sellingPrice: newProduct.sellingPrice,
        manufacturingCost: newProduct.purchaseCost,
        description: newProduct.description,
      },
    }).catch(() => null);

    // Save Raw Material Component Quantities as BOM in DB
    if (Array.isArray(rmQuantities) && rmQuantities.length > 0) {
      const bomNumber = `BOM-${newProduct.sku || newProduct.productCode}-${Date.now().toString().slice(-4)}`;
      await prisma.bOM.create({
        data: {
          bomNumber,
          productId: newProduct.id,
          productName: newProduct.name,
          version: 1,
          status: 'Active',
          createdDate: new Date().toISOString().split('T')[0],
          createdBy: 'Admin',
          items: {
            create: rmQuantities.map((rmq: any) => ({
              rawMaterialId: rmq.rawMaterialId,
              rawMaterialName: rmq.rawMaterialName,
              sku: rmq.sku || '',
              unit: rmq.unit || 'PCS',
              quantity: Number(rmq.quantityUsed || 1),
              wastagePercent: Number(rmq.wastagePercent || 0),
              notes: rmq.notes || '',
            })),
          },
        },
      });

      // Deduct used raw materials from raw material inventory
      const prodStock = parseFloat(body.currentStock || body.openingStock || 0);
      if (prodStock > 0) {
        for (const rmq of rmQuantities) {
          const totalUsed = Math.round(
            (Number(rmq.quantityUsed || 1) * (1 + Number(rmq.wastagePercent || 0) / 100)) * prodStock
          );
          if (totalUsed > 0) {
            const targetRM = await prisma.rawMaterial.findFirst({
              where: {
                OR: [
                  ...(rmq.rawMaterialId ? [{ id: rmq.rawMaterialId }] : []),
                  ...(rmq.sku ? [{ sku: rmq.sku }] : []),
                  ...(rmq.rawMaterialName ? [{ name: rmq.rawMaterialName }] : []),
                ],
              },
            });
            if (targetRM) {
              const newRMStock = Math.max(0, targetRM.currentStock - totalUsed);
              await prisma.rawMaterial.update({
                where: { id: targetRM.id },
                data: { currentStock: newRMStock },
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...newProduct,
        rawMaterialQuantities: rmQuantities || [],
      },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create product' },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, sku, productCode, ...data } = body;
    if (!id && !sku && !productCode) {
      return NextResponse.json({ success: false, message: 'Product ID, SKU, or Product Code is required for update' }, { status: 400 });
    }

    const existing = await prisma.productMaster.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(id ? [{ sku: id }] : []),
          ...(id ? [{ productCode: id }] : []),
          ...(sku ? [{ sku }] : []),
          ...(sku ? [{ id: sku }] : []),
          ...(productCode ? [{ productCode }] : []),
          ...(data.sku ? [{ sku: data.sku }] : []),
          ...(data.productCode ? [{ productCode: data.productCode }] : []),
        ],
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Product not found in database' }, { status: 404 });
    }

    const rmQuantities = data.rawMaterialQuantities;

    const updatedProduct = await prisma.productMaster.update({
      where: { id: existing.id },
      data: {
        ...(data.productCode && { productCode: data.productCode }),
        ...(data.sku && { sku: data.sku }),
        ...(data.name && { name: data.name }),
        ...(data.category && { category: data.category }),
        ...(data.brand !== undefined && { brand: data.brand }),
        ...(data.connectorType !== undefined && { connectorType: data.connectorType }),
        ...(data.cableLengthWireSpec !== undefined && { cableLengthWireSpec: data.cableLengthWireSpec }),
        ...(data.vehicleScannerCompatibility !== undefined && { vehicleScannerCompatibility: data.vehicleScannerCompatibility }),
        ...(data.subcategory !== undefined && { subcategory: data.subcategory }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.purchaseCost !== undefined && { purchaseCost: parseFloat(data.purchaseCost) }),
        ...(data.sellingPrice !== undefined && { sellingPrice: parseFloat(data.sellingPrice) }),
        ...(data.discount !== undefined && { discount: parseFloat(data.discount) }),
        ...(data.gstPercent !== undefined && { gstPercent: parseFloat(data.gstPercent) }),
        ...(data.hsnSac !== undefined && { hsnSac: data.hsnSac }),
        ...(data.openingStock !== undefined && { openingStock: parseFloat(data.openingStock) }),
        ...(data.currentStock !== undefined && { currentStock: parseFloat(data.currentStock) }),
        ...(data.minStock !== undefined && { minStock: parseFloat(data.minStock) }),
        ...(data.maxStock !== undefined && { maxStock: parseFloat(data.maxStock) }),
        ...(data.status && { status: data.status }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(Array.isArray(rmQuantities) ? { rawMaterialQuantities: JSON.stringify(rmQuantities) } : {}),
      },
    });

    // Also sync FinishedGood model if present
    if (data.currentStock !== undefined) {
      await prisma.finishedGood.updateMany({
        where: {
          OR: [
            { sku: existing.sku },
            ...(existing.productCode ? [{ sku: existing.productCode }] : []),
            { name: existing.name },
          ],
        },
        data: {
          currentStock: parseFloat(data.currentStock),
        },
      }).catch(() => null);
    }

    // Handle Raw Material Quantities / BOM updates
    if (Array.isArray(rmQuantities)) {
      const existingBOM = await prisma.bOM.findFirst({
        where: {
          OR: [
            { productId: existing.id },
            ...(existing.productCode ? [{ productId: existing.productCode }] : []),
            ...(existing.sku ? [{ productId: existing.sku }] : []),
            { productName: existing.name },
          ],
        },
        include: { items: true },
      });

      if (rmQuantities.length > 0) {
        if (existingBOM) {
          await prisma.bOMItem.deleteMany({
            where: { bomId: existingBOM.id },
          });
          await prisma.bOM.update({
            where: { id: existingBOM.id },
            data: {
              status: 'Active',
              items: {
                create: rmQuantities.map((rmq: any) => ({
                  rawMaterialId: rmq.rawMaterialId,
                  rawMaterialName: rmq.rawMaterialName,
                  sku: rmq.sku || '',
                  unit: rmq.unit || 'PCS',
                  quantity: Number(rmq.quantityUsed || 1),
                  wastagePercent: Number(rmq.wastagePercent || 0),
                  notes: rmq.notes || '',
                })),
              },
            },
          });
        } else {
          const bomNumber = `BOM-${existing.sku || existing.productCode}-${Date.now().toString().slice(-4)}`;
          await prisma.bOM.create({
            data: {
              bomNumber,
              productId: existing.id,
              productName: existing.name,
              version: 1,
              status: 'Active',
              createdDate: new Date().toISOString().split('T')[0],
              createdBy: 'Admin',
              items: {
                create: rmQuantities.map((rmq: any) => ({
                  rawMaterialId: rmq.rawMaterialId,
                  rawMaterialName: rmq.rawMaterialName,
                  sku: rmq.sku || '',
                  unit: rmq.unit || 'PCS',
                  quantity: Number(rmq.quantityUsed || 1),
                  wastagePercent: Number(rmq.wastagePercent || 0),
                  notes: rmq.notes || '',
                })),
              },
            },
          });
        }

        // Deduct raw material stock for this product's currentStock
        const prodStock = parseFloat(
          data.currentStock !== undefined ? data.currentStock : existing.currentStock
        );
        if (prodStock > 0) {
          for (const rmq of rmQuantities) {
            const totalUsed = Math.round(
              (Number(rmq.quantityUsed || 1) * (1 + Number(rmq.wastagePercent || 0) / 100)) * prodStock
            );
            if (totalUsed > 0) {
              const targetRM = await prisma.rawMaterial.findFirst({
                where: {
                  OR: [
                    ...(rmq.rawMaterialId ? [{ id: rmq.rawMaterialId }] : []),
                    ...(rmq.sku ? [{ sku: rmq.sku }] : []),
                    ...(rmq.rawMaterialName ? [{ name: rmq.rawMaterialName }] : []),
                  ],
                },
              });
              if (targetRM) {
                const newRMStock = Math.max(0, targetRM.currentStock - totalUsed);
                await prisma.rawMaterial.update({
                  where: { id: targetRM.id },
                  data: { currentStock: newRMStock },
                });
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedProduct,
        rawMaterialQuantities: rmQuantities || [],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update product' },
      { status: 500 }
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

    const existing = await prisma.productMaster.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(sku ? [{ sku }] : []),
        ],
      },
    });

    if (!existing) {
      return NextResponse.json({ success: true, message: 'Product already deleted or not found' });
    }

    await prisma.productMaster.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: 'Product deleted successfully from database' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
