import { NextRequest, NextResponse } from 'next/server'

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY

interface YouTubeVideo {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: number
}

// Parse ISO 8601 duration format (PT4M33S) to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)
  
  return hours * 3600 + minutes * 60 + seconds
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API key is not configured')
      return NextResponse.json(
        { error: 'YouTube API is not configured' },
        { status: 500 }
      )
    }

    // Step 1: Search for videos
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
    searchUrl.searchParams.append('part', 'snippet')
    searchUrl.searchParams.append('q', query)
    searchUrl.searchParams.append('type', 'video')
    searchUrl.searchParams.append('maxResults', '10')
    searchUrl.searchParams.append('videoCategoryId', '10') // Music category
    searchUrl.searchParams.append('key', YOUTUBE_API_KEY)

    const searchResponse = await fetch(searchUrl.toString())
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json()
      console.error('YouTube API search error:', errorData)
      return NextResponse.json(
        { error: 'YouTube API search failed' },
        { status: searchResponse.status }
      )
    }

    const searchData = await searchResponse.json()

    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json([])
    }

    // Step 2: Get video details including duration
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',')
    
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
    detailsUrl.searchParams.append('part', 'contentDetails,snippet')
    detailsUrl.searchParams.append('id', videoIds)
    detailsUrl.searchParams.append('key', YOUTUBE_API_KEY)

    const detailsResponse = await fetch(detailsUrl.toString())
    
    if (!detailsResponse.ok) {
      const errorData = await detailsResponse.json()
      console.error('YouTube API details error:', errorData)
      return NextResponse.json(
        { error: 'YouTube API details failed' },
        { status: detailsResponse.status }
      )
    }

    const detailsData = await detailsResponse.json()

    // Step 3: Format results
    const results: YouTubeVideo[] = detailsData.items.map((item: any) => {
      const snippet = item.snippet
      const duration = parseDuration(item.contentDetails.duration)
      
      // Try to extract artist from title (usually before a hyphen or "by")
      let title = snippet.title
      let artist = snippet.channelTitle
      
      const hyphenMatch = title.match(/^([^-]+)\s*-\s*(.+)$/)
      if (hyphenMatch) {
        artist = hyphenMatch[1].trim()
        title = hyphenMatch[2].trim()
      }

      return {
        id: item.id,
        title,
        artist,
        thumbnail: snippet.thumbnails.medium.url,
        duration,
      }
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error('YouTube search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
