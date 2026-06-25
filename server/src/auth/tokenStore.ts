interface GoogleTokens {
  accessToken: string
  refreshToken?: string
  expiryDate?: number
}

interface AsanaTokens {
  accessToken: string
  refreshToken?: string
  expiresAt: number
}

let googleTokens: GoogleTokens | null = null
let asanaTokens: AsanaTokens | null = null

export const tokenStore = {
  getGoogleTokens: () => googleTokens,
  setGoogleTokens: (tokens: GoogleTokens) => {
    googleTokens = tokens
  },
  getAsanaTokens: () => asanaTokens,
  setAsanaTokens: (tokens: AsanaTokens) => {
    asanaTokens = tokens
  },
}
