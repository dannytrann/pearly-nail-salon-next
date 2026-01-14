import { SquareClient, SquareEnvironment } from 'square'

let squareClient = null

export const getSquareClient = () => {
  if (!process.env.SQUARE_ACCESS_TOKEN || process.env.SQUARE_ACCESS_TOKEN === 'your_square_access_token_here') {
    throw new Error('Square Access Token not configured')
  }

  if (!process.env.SQUARE_LOCATION_ID || process.env.SQUARE_LOCATION_ID === 'your_square_location_id_here') {
    throw new Error('Square Location ID not configured')
  }

  // Lazy initialize the client only when needed (SDK v43+ uses 'token' and 'baseUrl')
  if (!squareClient) {
    squareClient = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN,
      baseUrl: process.env.SQUARE_ENVIRONMENT === 'production'
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
    })
  }

  return squareClient
}

export const getLocationId = () => {
  return process.env.SQUARE_LOCATION_ID
}

export default getSquareClient
