import { eq, and, isNull, like, desc, inArray } from 'drizzle-orm'
import { getDb, getSqlite } from '../db'
import { products, productCategories, stockMovements, productImages } from '../db/schema'
import { newId } from '../utils/uuid'
import { BaseService } from './base.service'
import type { Product, NewProduct, ProductCategory } from '../db/schema'

export class InventoryService extends BaseService {
  async listProducts(filters?: {
    search?: string
    categoryId?: string
    status?: string
    lowStock?: boolean
  }): Promise<Array<Product & { primaryImagePath?: string | null }>> {
    const db = getDb()
    const rows = await db
      .select()
      .from(products)
      .where(and(isNull(products.deletedAt)))
      .orderBy(desc(products.updatedAt))

    let result = rows
    if (filters?.search) {
      const s = filters.search.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.sku.toLowerCase().includes(s) ||
          (p.barcode && p.barcode.includes(s)) ||
          (p.description && p.description.toLowerCase().includes(s))
      )
    }
    if (filters?.categoryId) {
      result = result.filter((p) => p.categoryId === filters.categoryId)
    }
    if (filters?.status) {
      result = result.filter((p) => p.status === filters.status)
    }
    if (filters?.lowStock) {
      result = result.filter((p) => p.stockQty - p.reservedQty <= p.lowStockThreshold)
    }

    if (result.length === 0) return result

    const images = await db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, result.map((item) => item.id)))

    return result.map((product) => {
      const primary =
        images.find((image) => image.productId === product.id && image.isPrimary) ??
        images.find((image) => image.productId === product.id)

      return {
        ...product,
        primaryImagePath: primary?.imagePath ?? null
      }
    })
  }

  async getProduct(id: string): Promise<Product | null> {
    const db = getDb()
    const [row] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), isNull(products.deletedAt)))
      .limit(1)
    return row ?? null
  }

  async createProduct(
    data: Omit<NewProduct, 'id' | 'createdAt' | 'updatedAt'> & { imagePath?: string | null },
    userId?: string
  ): Promise<Product> {
    const db = getDb()
    const id = newId()
    const now = new Date()
    const { imagePath, ...productData } = data

    await db.insert(products).values({ id, ...productData, createdAt: now, updatedAt: now })

    if (imagePath) {
      await db.insert(productImages).values({
        id: newId(),
        productId: id,
        imagePath,
        isPrimary: true,
        sortOrder: 0,
        createdAt: now
      })
    }

    if ((productData.stockQty ?? 0) > 0) {
      await this.recordStockMovement({
        productId: id,
        type: 'IN',
        qtyChange: productData.stockQty ?? 0,
        note: 'Initial stock',
        createdBy: userId
      })
    }

    this.auditLog({ userId, action: 'CREATE', entityType: 'product', entityId: id, newValue: data })
    const [product] = await db.select().from(products).where(eq(products.id, id))
    return product
  }

  async updateProduct(id: string, data: Partial<NewProduct> & { imagePath?: string | null }, userId?: string): Promise<void> {
    const db = getDb()
    const [before] = await db.select().from(products).where(eq(products.id, id))
    const { imagePath, ...productData } = data

    await db.update(products).set({ ...productData, updatedAt: new Date() }).where(eq(products.id, id))

    if (imagePath !== undefined) {
      const existingImages = await db.select().from(productImages).where(eq(productImages.productId, id))
      const primaryImage = existingImages.find((image) => image.isPrimary) ?? existingImages[0]

      if (imagePath) {
        if (primaryImage) {
          await db
            .update(productImages)
            .set({ imagePath, isPrimary: true, sortOrder: 0 })
            .where(eq(productImages.id, primaryImage.id))
        } else {
          await db.insert(productImages).values({
            id: newId(),
            productId: id,
            imagePath,
            isPrimary: true,
            sortOrder: 0,
            createdAt: new Date()
          })
        }
      } else if (primaryImage) {
        await db.delete(productImages).where(eq(productImages.id, primaryImage.id))
      }
    }

    this.auditLog({ userId, action: 'UPDATE', entityType: 'product', entityId: id, oldValue: before, newValue: data })
  }

  async deleteProduct(id: string, userId?: string): Promise<void> {
    const db = getDb()
    await db.update(products).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(products.id, id))
    this.auditLog({ userId, action: 'DELETE', entityType: 'product', entityId: id })
  }

  async recordStockMovement(data: {
    productId: string
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESERVED' | 'RELEASED'
    qtyChange: number
    referenceType?: string
    referenceId?: string
    note?: string
    reason?: string
    createdBy?: string
  }): Promise<void> {
    const db = getDb()
    await db.insert(stockMovements).values({ id: newId(), ...data, createdAt: new Date() })

    // Update stock qty
    const [product] = await db.select().from(products).where(eq(products.id, data.productId))
    if (!product) return

    if (data.type === 'IN' || data.type === 'ADJUSTMENT') {
      await db
        .update(products)
        .set({ stockQty: product.stockQty + data.qtyChange, updatedAt: new Date() })
        .where(eq(products.id, data.productId))
    } else if (data.type === 'OUT') {
      await db
        .update(products)
        .set({ stockQty: product.stockQty - data.qtyChange, updatedAt: new Date() })
        .where(eq(products.id, data.productId))
    } else if (data.type === 'RESERVED') {
      await db
        .update(products)
        .set({ reservedQty: product.reservedQty + data.qtyChange, updatedAt: new Date() })
        .where(eq(products.id, data.productId))
    } else if (data.type === 'RELEASED') {
      await db
        .update(products)
        .set({
          reservedQty: Math.max(0, product.reservedQty - data.qtyChange),
          updatedAt: new Date()
        })
        .where(eq(products.id, data.productId))
    }
  }

  async getLowStockProducts(): Promise<Product[]> {
    const db = getDb()
    const all = await db.select().from(products).where(isNull(products.deletedAt))
    return all.filter((p) => p.stockQty - p.reservedQty <= p.lowStockThreshold && p.status !== 'discontinued')
  }

  async listCategories(): Promise<ProductCategory[]> {
    const db = getDb()
    return db.select().from(productCategories).where(isNull(productCategories.deletedAt))
  }

  async createCategory(data: { name: string; description?: string; parentId?: string }): Promise<ProductCategory> {
    const db = getDb()
    const id = newId()
    const now = new Date()
    await db.insert(productCategories).values({ id, ...data, createdAt: now, updatedAt: now })
    const [cat] = await db.select().from(productCategories).where(eq(productCategories.id, id))
    return cat
  }

  async getStockMovements(productId: string): Promise<typeof stockMovements.$inferSelect[]> {
    const db = getDb()
    return db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.productId, productId))
      .orderBy(desc(stockMovements.createdAt))
  }

  async getNextSku(categoryCode: string): Promise<string> {
    const db = getDb()
    const rows = await db
      .select()
      .from(products)
      .where(like(products.sku, `${categoryCode}-%`))
    const max = rows.length > 0 ? Math.max(...rows.map((r) => parseInt(r.sku.split('-')[1] ?? '0'))) : 0
    return `${categoryCode}-${String(max + 1).padStart(4, '0')}`
  }
}
