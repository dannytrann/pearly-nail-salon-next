import { NextResponse } from 'next/server'
import { services, categories, technicians } from '@/lib/mockData'
import { getSquareClient, getLocationId } from '@/lib/squareClient'

// Fetch technicians from Square Team API
async function fetchSquareTeamMembers() {
  try {
    const client = getSquareClient()
    const locationId = getLocationId()

    const response = await client.teamMembers.search({
      query: {
        filter: {
          locationIds: [locationId],
          status: 'ACTIVE'
        }
      }
    })

    const squareTechnicians = []

    if (response.teamMembers) {
      for (const member of response.teamMembers) {
        squareTechnicians.push({
          id: member.id,
          name: `${member.givenName || ''} ${member.familyName || ''}`.trim() || 'Team Member',
          squareTeamMemberId: member.id,
          isActive: member.status === 'ACTIVE'
        })
      }
    }

    return squareTechnicians
  } catch (error) {
    console.error('Error fetching Square team members:', error)
    throw error
  }
}

// Fetch services from Square Catalog
async function fetchSquareServices() {
  try {
    const client = getSquareClient()

    // Fetch categories first
    const categoryResponse = await client.catalog.search({ objectTypes: ['CATEGORY'] })

    // Fetch only bookable appointment services using searchItems
    // This filters to only services that have "Allow customers to book online" enabled
    const response = await client.catalog.searchItems({
      productTypes: ['APPOINTMENTS_SERVICE']
    })

    const squareServices = []
    const serviceCategories = {}
    const categoryMap = {}

    // Build a map of category IDs to category names
    if (categoryResponse.objects) {
      for (const obj of categoryResponse.objects) {
        if (obj.type === 'CATEGORY' && obj.categoryData) {
          categoryMap[obj.id] = obj.categoryData.name
        }
      }
    }

    // Process bookable items from searchCatalogItems response
    // searchCatalogItems returns 'items' array instead of 'objects'
    const items = response.items || []
    console.log(`Found ${items.length} bookable appointment services`)

    for (const item of items) {
      if (item.type === 'ITEM' && item.itemData) {
        const itemData = item.itemData

        // Get category name from map, or use default
        // SDK v43: categories are in itemData.categories array or reportingCategory
        const categoryId = itemData.categories?.[0]?.id || itemData.reportingCategory?.id
        const categoryName = categoryId && categoryMap[categoryId]
          ? categoryMap[categoryId]
          : 'Other Services'

        // Get the first variation (most items have one variation)
        const variation = itemData.variations?.[0]
        if (!variation) continue

        // Try to get duration from item custom attributes or default to 30
        let duration = 30
        if (itemData.customAttributeValues) {
          const durationAttr = Object.values(itemData.customAttributeValues).find(
            attr => attr.name?.toLowerCase().includes('duration')
          )
          if (durationAttr && durationAttr.numberValue) {
            duration = parseInt(durationAttr.numberValue)
          }
        }

        const service = {
          id: item.id,
          name: itemData.name,
          category: categoryName,
          price: variation.itemVariationData?.priceMoney?.amount
            ? Number(variation.itemVariationData.priceMoney.amount) / 100
            : 0,
          duration: duration,
          description: itemData.description || '',
          squareItemId: item.id,
          squareVariationId: variation.id
        }

        squareServices.push(service)

        if (!serviceCategories[categoryName]) {
          serviceCategories[categoryName] = []
        }
        serviceCategories[categoryName].push(service)
      }
    }

    // Fetch technicians from Square (no mock fallback in production)
    let squareTechnicians = []
    if (process.env.USE_SQUARE_TECHNICIANS === 'true') {
      squareTechnicians = await fetchSquareTeamMembers()
    }

    return {
      services: squareServices,
      categories: serviceCategories,
      technicians: squareTechnicians
    }
  } catch (error) {
    console.error('Error fetching Square services:', error)
    throw error
  }
}

export async function GET() {
  try {
    const useSquareServices = process.env.USE_SQUARE_SERVICES === 'true'

    if (useSquareServices) {
      const squareData = await fetchSquareServices()
      return NextResponse.json({
        success: true,
        ...squareData,
        source: 'square'
      })
    }

    // Only use mock data if Square is explicitly disabled
    return NextResponse.json({
      success: true,
      services,
      categories,
      technicians,
      source: 'mock'
    })
  } catch (error) {
    console.error('Services API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch services' },
      { status: 500 }
    )
  }
}
