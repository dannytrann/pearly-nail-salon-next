import { NextResponse } from 'next/server'
import { services, categories, technicians } from '@/lib/mockData'
import { getSquareClient, getLocationId } from '@/lib/squareClient'

// Display name mappings for team members
// Maps Square's full name to a preferred display name
const TECHNICIAN_DISPLAY_NAMES = {
  'Cheng Ping Deng': 'Simone',
}

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
        const fullName = `${member.givenName || ''} ${member.familyName || ''}`.trim()
        const displayName = TECHNICIAN_DISPLAY_NAMES[fullName] || fullName || 'Team Member'

        squareTechnicians.push({
          id: member.id,
          name: displayName,
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

// Services to exclude from online booking (by name or ID)
// Add service names here that shouldn't appear in online booking
const EXCLUDED_SERVICES = [
  'Cuticle Trim',
  'Gel Overlay 🙌',
  'Nail Trim *fingers',
  'Nail Trim *toes 🦶',
]

// Fetch services from Square Catalog
async function fetchSquareServices() {
  try {
    const client = getSquareClient()

    console.time('Fetch categories and services')
    // Fetch categories and services in parallel for faster loading
    const [categoryResponse, response] = await Promise.all([
      client.catalog.search({ objectTypes: ['CATEGORY'] }),
      client.catalog.searchItems({ productTypes: ['APPOINTMENTS_SERVICE'] })
    ])
    console.timeEnd('Fetch categories and services')

    const squareServices = []
    const serviceCategories = {}
    const categoryMap = {}

    console.time('Build category map')
    // Build a map of category IDs to category names
    if (categoryResponse.objects) {
      for (const obj of categoryResponse.objects) {
        if (obj.type === 'CATEGORY' && obj.categoryData) {
          categoryMap[obj.id] = obj.categoryData.name
        }
      }
    }
    console.timeEnd('Build category map')

    // Process bookable items from searchCatalogItems response
    // searchCatalogItems returns 'items' array instead of 'objects'
    const items = response.items || []
    console.log(`Found ${items.length} bookable appointment services`)

    console.time('Process services')
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

        // Get duration from variation's serviceDuration (in milliseconds) or default to 30 min
        let duration = 30
        if (variation.itemVariationData?.serviceDuration) {
          // serviceDuration is in milliseconds, convert to minutes
          duration = Math.round(Number(variation.itemVariationData.serviceDuration) / 60000)
        } else if (itemData.customAttributeValues) {
          // Fallback to custom attributes if serviceDuration not available
          const durationAttr = Object.values(itemData.customAttributeValues).find(
            attr => attr.name?.toLowerCase().includes('duration')
          )
          if (durationAttr && durationAttr.numberValue) {
            duration = parseInt(durationAttr.numberValue)
          }
        }

        // Skip excluded services
        if (EXCLUDED_SERVICES.includes(itemData.name)) {
          console.log(`Excluding service: ${itemData.name}`)
          continue
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
    console.timeEnd('Process services')

    // Fetch technicians from Square (no mock fallback in production)
    let squareTechnicians = []
    if (process.env.USE_SQUARE_TECHNICIANS === 'true') {
      console.time('Fetch technicians')
      squareTechnicians = await fetchSquareTeamMembers()
      console.timeEnd('Fetch technicians')
    }

    console.log('Total services:', squareServices.length)
    console.log('Total technicians:', squareTechnicians.length)

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
    console.time('Total services API')
    const useSquareServices = process.env.USE_SQUARE_SERVICES === 'true'

    if (useSquareServices) {
      const squareData = await fetchSquareServices()
      console.timeEnd('Total services API')

      // Cache for 5 minutes (300 seconds) to speed up subsequent loads
      return NextResponse.json({
        success: true,
        ...squareData,
        source: 'square'
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
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
