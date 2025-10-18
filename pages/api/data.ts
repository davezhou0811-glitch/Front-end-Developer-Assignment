import type { NextApiRequest, NextApiResponse } from 'next'

type ApiSuccess = unknown

type ApiError = {
  error: string
  status: number
}

const DEFAULT_API_URL = 'https://closet-recruiting-api.azurewebsites.net/api/data'
const API_URL = process.env.CLOSET_API_URL ?? DEFAULT_API_URL
const FETCH_TIMEOUT_MS = 10_000

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiSuccess | ApiError>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ error: 'Method Not Allowed', status: 405 })

    return
  }

  // Optional: basic cache control for this API route (tune as needed)
  // res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(API_URL, { signal: controller.signal })

    if (!response.ok) {
      // Forward an error with upstream status code (do not blindly forward upstream body shape)
      res
        .status(response.status)
        .json({ error: response.statusText || 'Upstream Error', status: response.status })

      return
    }

    // If upstream returns non-JSON or invalid JSON, guard it
    let data: ApiSuccess

    try {
      data = (await response.json()) as ApiSuccess
    } catch {
      res.status(502).json({ error: 'Bad Gateway: Invalid JSON from upstream', status: 502 })

      return
    }

    res.status(200).json(data)
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === 'AbortError'
    const message = err instanceof Error ? err.message : 'Unknown error'

    res.status(500).json({
      error: isAbort ? 'Upstream request timed out' : `Internal Server Error: ${message}`,
      status: 500
    })
  } finally {
    clearTimeout(timer)
  }
}
