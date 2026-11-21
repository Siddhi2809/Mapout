import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    let products: any[] = [];
    let totalCount = 0;

    if (pageParam || limitParam) {
      const page = Math.max(1, parseInt(pageParam || '1', 10));
      const limit = Math.max(1, Math.min(200, parseInt(limitParam || '50', 10)));
      const skip = (page - 1) * limit;

      try {
        [products, totalCount] = await Promise.all([
          prisma.productMaster.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.productMaster.count(),
        ]);
      } catch {
        products = await prisma.$queryRawUnsafe(`
          SELECT 
            id, "productCode", sku, name, category, brand, "connectorType", "cableLengthWireSpec",
            "vehicleScannerCompatibility", subcategory, description, COALESCE("purchaseCost", 0) as "purchaseCost",
            COALESCE("sellingPrice", 0) as "sellingPrice", COALESCE(discount, 0) as discount,
            COALESCE("gstPercent", 18) as "gstPercent", "hsnSac", COALESCE("openingStock", 0) as "openingStock",
            COALESCE("currentStock", 0) as "currentStock", COALESCE("minStock", 0) as "minStock",
            COALESCE("maxStock", 1000) as "maxStock", status, "imageUrl", "rawMaterialQuantities", "createdAt", "updatedAt"
          FROM "ProductMaster" ORDER BY "createdAt" DESC LIMIT $1 OFFSET $2
        `, limit, skip);
        totalCount = products.length;
      }
    } else {
      try {
        products = await prisma.productMaster.findMany({
          orderBy: { createdAt: 'desc' },
        });
        totalCount = products.length;
      } catch (prismaErr) {
        products = await prisma.$queryRawUnsafe(`
          SELECT 
            id, "productCode", sku, name, category, brand, "connectorType", "cableLengthWireSpec",
            "vehicleScannerCompatibility", subcategory, description, COALESCE("purchaseCost", 0) as "purchaseCost",
            COALESCE("sellingPrice", 0) as "sellingPrice", COALESCE(discount, 0) as discount,
            COALESCE("gstPercent", 18) as "gstPercent", "hsnSac", COALESCE("openingStock", 0) as "openingStock",
            COALESCE("currentStock", 0) as "currentStock", COALESCE("minStock", 0) as "minStock",
            COALESCE("maxStock", 1000) as "maxStock", status, "imageUrl", "rawMaterialQuantities", "createdAt", "updatedAt"
          FROM "ProductMaster" ORDER BY "createdAt" DESC
        `);
        totalCount = products.length;
      }
    }

    // 2. Fetch all BOMs with items to populate rawMaterialQuantities if needed
    let boms: any[] = [];
    try {
      boms = await prisma.bOM.findMany({
        include: { items: true },
      });
    } catch {
      boms = [];
    }

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
          boms.find((b) => b.productName?.toLowerCase() === p.name?.toLowerCase());

        rawMaterialQuantities = activeBOM
          ? activeBOM.items.map((i: any) => ({
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
        returnCount: p.returnCount ?? 0,
        onlineSalesCount: p.onlineSalesCount ?? 0,
        offlineSalesCount: p.offlineSalesCount ?? 0,
        salesCount: p.salesCount ?? 0,
        replacementCount: p.replacementCount ?? 0,
        rawMaterialQuantities,
      };
    });

    return NextResponse.json({
      success: true,
      data: productsWithQuantities,
      pagination: {
        totalCount,
      },
    });
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

      // Deduct used raw materials from raw material inventory (deduct ONLY the used amount, e.g. 5 or 20)
      for (const rmq of rmQuantities) {
        const usedAmount = Number(rmq.quantityUsed || 0);
        if (usedAmount > 0) {
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
            const newRMStock = Math.max(0, targetRM.currentStock - usedAmount);
            await prisma.rawMaterial.update({
              where: { id: targetRM.id },
              data: { currentStock: newRMStock },
            });
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

    // 1. Handle Batch Deductions (Used when production completes/packs sales orders)
    if (Array.isArray(body.deductions)) {
      const results: any[] = [];
      for (const item of body.deductions) {
        const itemQty = parseFloat(item.quantity || 0);
        if (itemQty <= 0) continue;

        const targetId = item.productId || item.id;
        const targetSku = item.sku;
        const targetName = item.productName || item.name;

        const prod = await prisma.productMaster.findFirst({
          where: {
            OR: [
              ...(targetId ? [{ id: targetId }] : []),
              ...(targetId ? [{ sku: targetId }] : []),
              ...(targetSku ? [{ sku: targetSku }] : []),
              ...(targetName ? [{ name: targetName }] : []),
            ],
          },
        });

        if (prod) {
          // Increment salesCount and update currentStock according to: currentStock = openingStock + returnCount - salesCount
          await prisma.$executeRawUnsafe(
            `UPDATE "ProductMaster" 
             SET "salesCount" = COALESCE("salesCount", 0) + $1,
                 "currentStock" = GREATEST(0, COALESCE("openingStock", 0) + COALESCE("returnCount", 0) - (COALESCE("salesCount", 0) + $1))
             WHERE id = $2`,
            itemQty,
            prod.id
          );

          const updatedProd: any[] = await prisma.$queryRawUnsafe(
            `SELECT id, sku, name, "openingStock", "currentStock", "salesCount", "returnCount" 
             FROM "ProductMaster" WHERE id = $1`,
            prod.id
          );

          if (updatedProd && updatedProd.length > 0) {
            results.push({
              id: updatedProd[0].id,
              name: updatedProd[0].name,
              sku: updatedProd[0].sku,
              deducted: itemQty,
              salesCount: updatedProd[0].salesCount,
              currentStock: updatedProd[0].currentStock,
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Successfully deducted finished goods product stock for sale.',
        data: results,
      });
    }

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

        // Adjust raw material stock based on difference (delta) in quantityUsed (only minus used amount)
        let prevQuantities: any[] = [];
        try {
          prevQuantities = existing.rawMaterialQuantities ? JSON.parse(existing.rawMaterialQuantities) : [];
        } catch {
          prevQuantities = [];
        }

        for (const rmq of rmQuantities) {
          const prevItem = Array.isArray(prevQuantities)
            ? prevQuantities.find(
                (p: any) =>
                  (rmq.rawMaterialId && p.rawMaterialId === rmq.rawMaterialId) ||
                  (rmq.sku && p.sku === rmq.sku) ||
                  (rmq.rawMaterialName && p.rawMaterialName && p.rawMaterialName.toLowerCase() === rmq.rawMaterialName.toLowerCase())
              )
            : null;
          const prevUsed = prevItem ? Number(prevItem.quantityUsed || 0) : 0;
          const currentUsed = Number(rmq.quantityUsed || 0);
          const delta = currentUsed - prevUsed;

          if (delta !== 0) {
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
              const newRMStock = Math.max(0, targetRM.currentStock - delta);
              await prisma.rawMaterial.update({
                where: { id: targetRM.id },
                data: { currentStock: newRMStock },
              });
            }
          }
        }

        // Restore stock for any raw materials that were removed from the product
        if (Array.isArray(prevQuantities)) {
          for (const prevItem of prevQuantities) {
            const stillPresent = rmQuantities.some(
              (r: any) =>
                (prevItem.rawMaterialId && r.rawMaterialId === prevItem.rawMaterialId) ||
                (prevItem.sku && r.sku === prevItem.sku) ||
                (prevItem.rawMaterialName && r.rawMaterialName && r.rawMaterialName.toLowerCase() === prevItem.rawMaterialName.toLowerCase())
            );
            if (!stillPresent) {
              const restoreAmount = Number(prevItem.quantityUsed || 0);
              if (restoreAmount > 0) {
                const targetRM = await prisma.rawMaterial.findFirst({
                  where: {
                    OR: [
                      ...(prevItem.rawMaterialId ? [{ id: prevItem.rawMaterialId }] : []),
                      ...(prevItem.sku ? [{ sku: prevItem.sku }] : []),
                      ...(prevItem.rawMaterialName ? [{ name: prevItem.rawMaterialName }] : []),
                    ],
                  },
                });
                if (targetRM) {
                  await prisma.rawMaterial.update({
                    where: { id: targetRM.id },
                    data: { currentStock: targetRM.currentStock + restoreAmount },
                  });
                }
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

    if (existing.rawMaterialQuantities) {
      try {
        const rmQuantities = JSON.parse(existing.rawMaterialQuantities);
        if (Array.isArray(rmQuantities)) {
          for (const rmq of rmQuantities) {
            const usedAmount = Number(rmq.quantityUsed || 0);
            if (usedAmount > 0) {
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
                await prisma.rawMaterial.update({
                  where: { id: targetRM.id },
                  data: { currentStock: targetRM.currentStock + usedAmount },
                });
              }
            }
          }
        }
      } catch {}
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
