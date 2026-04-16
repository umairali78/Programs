import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import {
  customerMeasurements,
  customerTags,
  expenses,
  fabricSuppliers,
  productCategories,
  productImages,
  products
} from '../db/schema'
import { newId } from '../utils/uuid'
import { CustomerService } from './customer.service'
import { FabricService } from './fabric.service'
import { InventoryService } from './inventory.service'
import { PaymentService } from './payment.service'
import { VendorService } from './vendor.service'
import { WorkOrderService } from './workorder.service'

function garmentImage(title: string, accent: string, panel: string, note: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 960">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#fff7f3" />
          <stop offset="100%" stop-color="#fbe7db" />
        </linearGradient>
        <linearGradient id="dress" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${accent}" />
          <stop offset="100%" stop-color="${panel}" />
        </linearGradient>
      </defs>
      <rect width="720" height="960" rx="48" fill="url(#bg)" />
      <circle cx="550" cy="180" r="120" fill="${panel}" opacity="0.14" />
      <circle cx="180" cy="770" r="150" fill="${accent}" opacity="0.12" />
      <path d="M305 210c0-30 24-54 55-54s55 24 55 54v64l80 66-46 84-43-25-16 335H280l-16-335-43 25-46-84 80-66z" fill="url(#dress)" />
      <path d="M275 734h170l24 88H251z" fill="${panel}" opacity="0.85" />
      <path d="M300 280h120l52 344H248z" fill="none" stroke="#fff6f1" stroke-width="10" stroke-dasharray="16 18" opacity="0.85" />
      <rect x="70" y="70" width="280" height="130" rx="28" fill="#ffffff" opacity="0.92" />
      <text x="100" y="118" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#7a2d1d">${title}</text>
      <text x="100" y="154" font-family="Arial, sans-serif" font-size="18" fill="#6b7280">${note}</text>
      <rect x="70" y="810" width="220" height="68" rx="22" fill="#ffffff" opacity="0.92" />
      <text x="100" y="853" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#7a2d1d">Demo Look</text>
    </svg>
  `

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export class DemoDataService {
  private inventoryService = new InventoryService()
  private vendorService = new VendorService()
  private customerService = new CustomerService()
  private fabricService = new FabricService()
  private workOrderService = new WorkOrderService()
  private paymentService = new PaymentService()

  async seed(userId?: string): Promise<{ message: string }> {
    const db = getDb()

    const [existingDemoProduct] = await db.select().from(products).where(eq(products.sku, 'DEMO-LHG-001')).limit(1)
    if (existingDemoProduct) {
      return { message: 'Demo data is already available in this workspace.' }
    }

    const now = new Date()

    const categoryIds = {
      bridal: newId(),
      festive: newId(),
      pret: newId()
    }

    await db.insert(productCategories).values([
      {
        id: categoryIds.bridal,
        name: 'Bridal Couture',
        description: 'Statement bridal looks for premium consultations.',
        sortOrder: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        id: categoryIds.festive,
        name: 'Festive Wear',
        description: 'Luxury formal and festive designs for seasonal demand.',
        sortOrder: 2,
        createdAt: now,
        updatedAt: now
      },
      {
        id: categoryIds.pret,
        name: 'Luxe Pret',
        description: 'Ready-to-wear pieces for quick fittings and retail display.',
        sortOrder: 3,
        createdAt: now,
        updatedAt: now
      }
    ])

    const supplierA = await this.fabricService.createSupplier({
      name: 'Noor Textiles',
      phone: '+92 42 35771234',
      address: 'Shah Alam Market, Lahore',
      notes: 'Reliable for bridal net, organza, and dyed lining.'
    })
    const supplierB = await this.fabricService.createSupplier({
      name: 'Rang Mahal Fabrics',
      phone: '+92 21 34880011',
      address: 'Tariq Road, Karachi',
      notes: 'Carries premium silk and embellished formal fabric.'
    })

    const fabricNet = await this.fabricService.createFabric(
      {
        name: 'Embellished Bridal Net',
        type: 'Net',
        color: 'Champagne Gold',
        widthCm: 110,
        unit: 'yard',
        costPerUnit: 2800,
        stockQty: 42,
        lowStockThreshold: 8,
        supplierId: supplierA.id,
        photoPath: garmentImage('Bridal Net', '#d7a86e', '#a35f35', 'Texture sample'),
        notes: 'Used in signature bridal lehengas and dupattas.'
      },
      userId
    )

    const fabricSilk = await this.fabricService.createFabric(
      {
        name: 'Pure Raw Silk',
        type: 'Silk',
        color: 'Deep Maroon',
        widthCm: 100,
        unit: 'yard',
        costPerUnit: 3200,
        stockQty: 28,
        lowStockThreshold: 6,
        supplierId: supplierB.id,
        photoPath: garmentImage('Raw Silk', '#7a2335', '#3f1623', 'Draped richness'),
        notes: 'Ideal for luxe formal shirts, lehenga borders, and jackets.'
      },
      userId
    )

    const fabricOrganza = await this.fabricService.createFabric(
      {
        name: 'Crystal Organza',
        type: 'Organza',
        color: 'Rose Blush',
        widthCm: 112,
        unit: 'yard',
        costPerUnit: 1900,
        stockQty: 36,
        lowStockThreshold: 7,
        supplierId: supplierA.id,
        photoPath: garmentImage('Organza', '#d9879e', '#9f546a', 'Sheer overlay'),
        notes: 'Popular for dupattas, sleeves, and layered formal panels.'
      },
      userId
    )

    const vendorKarhai = await this.vendorService.createVendor(
      {
        name: 'Sana Karhai Studio',
        phone: '+92 300 4441122',
        whatsapp: '+92 300 4441122',
        address: 'Liberty Market, Lahore',
        city: 'Lahore',
        specialtyTagsJson: JSON.stringify(['Bridal', 'Zardozi', 'Hand Embellishment']),
        notes: 'Known for bridal adda work and premium finish.',
        isActive: true
      },
      userId
    )
    const vendorStitching = await this.vendorService.createVendor(
      {
        name: 'Nisa Stitch Lab',
        phone: '+92 333 8809911',
        whatsapp: '+92 333 8809911',
        address: 'Gulberg III, Lahore',
        city: 'Lahore',
        specialtyTagsJson: JSON.stringify(['Lehenga', 'Formalwear', 'Custom Fit']),
        notes: 'Fast turnaround for bridal and formal garment stitching.',
        isActive: true
      },
      userId
    )
    const vendorFinishing = await this.vendorService.createVendor(
      {
        name: 'Adeel Finishing Works',
        phone: '+92 321 5553300',
        whatsapp: '+92 321 5553300',
        address: 'Anarkali, Lahore',
        city: 'Lahore',
        specialtyTagsJson: JSON.stringify(['Finishing', 'Steam Press', 'Quality Check']),
        notes: 'Reliable for pressing, packing, and urgent finishing jobs.',
        isActive: true
      },
      userId
    )

    await this.vendorService.addVendorService({
      vendorId: vendorKarhai.id,
      serviceType: 'Hand Embellishment',
      priceEconomy: 12000,
      priceStandard: 18000,
      pricePremium: 26000,
      turnaroundDaysMin: 5,
      turnaroundDaysMax: 9,
      notes: 'Heavy adda and naqshi work.'
    })
    await this.vendorService.addVendorService({
      vendorId: vendorStitching.id,
      serviceType: 'Bridal Stitching',
      priceEconomy: 9000,
      priceStandard: 13000,
      pricePremium: 18000,
      turnaroundDaysMin: 4,
      turnaroundDaysMax: 7,
      notes: 'Structured lehenga and gown silhouettes.'
    })
    await this.vendorService.addVendorService({
      vendorId: vendorFinishing.id,
      serviceType: 'Final Finishing',
      priceEconomy: 1800,
      priceStandard: 2500,
      pricePremium: 3400,
      turnaroundDaysMin: 1,
      turnaroundDaysMax: 2,
      notes: 'Pressing, tassels, packing and QC support.'
    })

    const tagVipId = newId()
    const tagBridalId = newId()
    await db.insert(customerTags).values([
      { id: tagVipId, name: 'VIP Bridal', color: '#9f2d21', createdAt: now },
      { id: tagBridalId, name: 'Repeat Client', color: '#0f766e', createdAt: now }
    ])

    const customerA = await this.customerService.createCustomer(
      {
        name: 'Maham Raza',
        phone: '+92 300 9001122',
        whatsapp: '+92 300 9001122',
        email: 'maham.raza@example.com',
        address: 'DHA Phase 5, Lahore',
        city: 'Lahore',
        dob: '1997-10-09',
        loyaltyPoints: 680,
        loyaltyTier: 'silver',
        tagsJson: JSON.stringify([tagVipId]),
        notes: 'Booked bridal consultation for December wedding.',
        isActive: true
      },
      userId
    )
    const customerB = await this.customerService.createCustomer(
      {
        name: 'Hira Salman',
        phone: '+92 321 7700456',
        whatsapp: '+92 321 7700456',
        email: 'hira.salman@example.com',
        address: 'Johar Town, Lahore',
        city: 'Lahore',
        dob: '1994-03-14',
        loyaltyPoints: 2450,
        loyaltyTier: 'gold',
        tagsJson: JSON.stringify([tagBridalId]),
        notes: 'Prefers elegant festive silhouettes and lighter dupattas.',
        isActive: true
      },
      userId
    )

    const measurementA = await this.customerService.saveMeasurement({
      customerId: customerA.id,
      garmentType: 'Bridal Lehenga',
      label: 'Winter Bridal Fit',
      chest: 35,
      waist: 30,
      hips: 39,
      shoulder: 14,
      length: 59,
      sleeve: 22,
      neck: 7,
      customJson: JSON.stringify({ flare: '140 inches', heelsHeight: '3 inches' }),
      takenBy: userId ?? null
    })
    const measurementB = await this.customerService.saveMeasurement({
      customerId: customerB.id,
      garmentType: 'Festive Peshwas',
      label: 'Eid Formal Fit',
      chest: 34,
      waist: 29,
      hips: 38,
      shoulder: 14,
      length: 56,
      sleeve: 21,
      neck: 6.5,
      customJson: JSON.stringify({ armhole: '15', frontNeckDepth: '7' }),
      takenBy: userId ?? null
    })

    const productA = await this.inventoryService.createProduct(
      {
        sku: 'DEMO-LHG-001',
        name: 'Mehrunisa Bridal Lehenga',
        categoryId: categoryIds.bridal,
        fabricId: fabricNet.id,
        colorPrimary: 'Maroon',
        colorSecondary: 'Antique Gold',
        sizeType: 'custom',
        costPrice: 28500,
        sellPrice: 65000,
        stockQty: 1,
        lowStockThreshold: 1,
        description: 'Heavy bridal lehenga with layered cancan and statement dupatta.',
        designNotes: 'Dense adda work, scalloped dupatta edges, and antique gold motifs.',
        embellishmentTags: JSON.stringify(['zardozi', 'sequins', 'naqshi']),
        seasonTag: 'Winter Wedding',
        collectionName: 'Noor Bridal Edit',
        storageLocation: 'Bridal Rack A2',
        isActive: true,
        status: 'active',
        imagePath: garmentImage('Mehrunisa Lehenga', '#8b2338', '#481621', 'Bridal couture')
      } as any,
      userId
    )

    const productB = await this.inventoryService.createProduct(
      {
        sku: 'DEMO-FRM-002',
        name: 'Rosette Formal Peshwas',
        categoryId: categoryIds.festive,
        fabricId: fabricOrganza.id,
        colorPrimary: 'Rose Blush',
        colorSecondary: 'Champagne',
        sizeType: 'custom',
        costPrice: 15200,
        sellPrice: 34900,
        stockQty: 2,
        lowStockThreshold: 1,
        description: 'Layered festive peshwas with organza sleeves and pearl detailing.',
        designNotes: 'Soft flare, crystal tassels, and airy dupatta styling.',
        embellishmentTags: JSON.stringify(['pearls', 'sequence', 'organza']),
        seasonTag: 'Eid Luxe',
        collectionName: 'Rang-e-Bahar',
        storageLocation: 'Formal Rail B4',
        isActive: true,
        status: 'active',
        imagePath: garmentImage('Rosette Peshwas', '#d8899c', '#94536a', 'Festive formal')
      } as any,
      userId
    )

    const productC = await this.inventoryService.createProduct(
      {
        sku: 'DEMO-PRT-003',
        name: 'Zarmina Silk Long Shirt',
        categoryId: categoryIds.pret,
        fabricId: fabricSilk.id,
        colorPrimary: 'Emerald',
        colorSecondary: 'Bronze',
        sizeType: 'standard',
        costPrice: 7200,
        sellPrice: 16900,
        stockQty: 4,
        lowStockThreshold: 2,
        description: 'Luxe pret long shirt with hand-finished neckline and silk trousers.',
        designNotes: 'Minimal luxury finish for retail-ready display.',
        embellishmentTags: JSON.stringify(['gota', 'cut dana']),
        seasonTag: 'Luxury Pret',
        collectionName: 'Studio Staples',
        storageLocation: 'Pret Shelf C1',
        isActive: true,
        status: 'active',
        imagePath: garmentImage('Zarmina Shirt', '#0f766e', '#0a4d4a', 'Retail piece')
      } as any,
      userId
    )

    const today = new Date()
    const dueA = new Date(today)
    dueA.setDate(today.getDate() + 12)
    const dueB = new Date(today)
    dueB.setDate(today.getDate() + 7)

    const workOrderA = await this.workOrderService.createWorkOrder({
      customerId: customerA.id,
      category: 'Bridal',
      orderType: 'NEW',
      priority: 'Urgent',
      dueDate: dueA.toISOString().slice(0, 10),
      notes: 'Bride requested fuller flare and second dupatta finish check.',
      totalAmount: 65000,
      discountAmount: 3000,
      discountReason: 'Launch collection client courtesy',
      taxAmount: 0,
      vendorCostTotal: 20500,
      customerApprovalRequired: true,
      items: [
        {
          productId: productA.id,
          customDescription: 'Custom bridal lehenga set',
          qty: 1,
          unitPrice: 65000,
          customizationNotes: 'Extended train and lighter cancan for movement.',
          measurementId: measurementA.id,
          fabricId: fabricNet.id,
          fabricQty: 8
        }
      ],
      stages: [
        {
          stageName: 'Karhai / Embroidery',
          sortOrder: 1,
          vendorId: vendorKarhai.id,
          serviceTier: 'premium',
          vendorCost: 12000,
          scheduledDate: new Date(today.getTime() + 2 * 86400000).toISOString().slice(0, 10)
        },
        {
          stageName: 'Stitching',
          sortOrder: 2,
          vendorId: vendorStitching.id,
          serviceTier: 'premium',
          vendorCost: 6500,
          scheduledDate: new Date(today.getTime() + 6 * 86400000).toISOString().slice(0, 10)
        },
        {
          stageName: 'Quality Check & Pressing',
          sortOrder: 3,
          vendorId: vendorFinishing.id,
          serviceTier: 'standard',
          vendorCost: 2000,
          scheduledDate: new Date(today.getTime() + 10 * 86400000).toISOString().slice(0, 10)
        }
      ],
      advancePayment: {
        amount: 25000,
        method: 'Bank Transfer',
        referenceNo: 'ADV-DEMO-001'
      },
      createdBy: userId
    })

    const workOrderB = await this.workOrderService.createWorkOrder({
      customerId: customerB.id,
      category: 'Formal',
      orderType: 'NEW',
      priority: 'Normal',
      dueDate: dueB.toISOString().slice(0, 10),
      notes: 'Festive outfit for Eid dinner. Keep dupatta lightweight.',
      totalAmount: 34900,
      discountAmount: 0,
      taxAmount: 0,
      vendorCostTotal: 9800,
      customerApprovalRequired: false,
      items: [
        {
          productId: productB.id,
          customDescription: 'Formal peshwas set',
          qty: 1,
          unitPrice: 34900,
          customizationNotes: 'Softer sleeves and medium flare.',
          measurementId: measurementB.id,
          fabricId: fabricOrganza.id,
          fabricQty: 5
        }
      ],
      stages: [
        {
          stageName: 'Stitching',
          sortOrder: 1,
          vendorId: vendorStitching.id,
          serviceTier: 'standard',
          vendorCost: 6200,
          scheduledDate: new Date(today.getTime() + 1 * 86400000).toISOString().slice(0, 10)
        },
        {
          stageName: 'Stone Work / Finishing',
          sortOrder: 2,
          vendorId: vendorFinishing.id,
          serviceTier: 'standard',
          vendorCost: 3600,
          scheduledDate: new Date(today.getTime() + 5 * 86400000).toISOString().slice(0, 10)
        }
      ],
      advancePayment: {
        amount: 12000,
        method: 'Cash'
      },
      createdBy: userId
    })

    await this.paymentService.recordPayment({
      workOrderId: workOrderB.id,
      amount: 8000,
      paymentType: 'PARTIAL',
      method: 'Card',
      referenceNo: 'POS-9981',
      note: 'Second milestone payment for festive order',
      receivedBy: userId,
      loyaltyPointsToAdd: 80,
      customerId: customerB.id
    })

    await db.insert(expenses).values({
      id: newId(),
      category: 'Marketing',
      description: 'Styled bridal campaign shoot setup for demo collection',
      amount: 8500,
      method: 'Bank Transfer',
      vendorId: vendorFinishing.id,
      expenseDate: today.toISOString().slice(0, 10),
      createdBy: userId ?? null,
      createdAt: new Date()
    })

    await db.insert(productImages).values([
      {
        id: newId(),
        productId: productA.id,
        imagePath: garmentImage('Mehrunisa Detail', '#b58654', '#7f4524', 'Dupatta border'),
        isPrimary: false,
        sortOrder: 1,
        createdAt: new Date()
      },
      {
        id: newId(),
        productId: productB.id,
        imagePath: garmentImage('Rosette Detail', '#f0a8b6', '#b86a80', 'Sleeve and flare'),
        isPrimary: false,
        sortOrder: 1,
        createdAt: new Date()
      },
      {
        id: newId(),
        productId: productC.id,
        imagePath: garmentImage('Zarmina Detail', '#1f8b7c', '#11514a', 'Neckline finish'),
        isPrimary: false,
        sortOrder: 1,
        createdAt: new Date()
      }
    ])

    return {
      message:
        'Demo data created: 3 categories, 3 fabrics, 3 vendors, 2 customers, 3 featured products, and 2 active work orders.'
    }
  }
}
