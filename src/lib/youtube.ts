import axios from 'axios'

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY

export interface YouTubeVideo {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: number
}

export interface SearchFilters {
  genre?: string
  decade?: number
  year?: number
  artist?: string
}

export async function searchYouTubeKaraoke(
  query: string,
  filters?: SearchFilters
): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured')
  }

  let searchQuery = `${query} karaoke`
  
  if (filters?.genre) searchQuery += ` ${filters.genre}`
  if (filters?.artist) searchQuery += ` ${filters.artist}`
  if (filters?.year) searchQuery += ` ${filters.year}`
  
  try {
    const response = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          part: 'snippet',
          q: searchQuery,
          type: 'video',
          videoCategoryId: '10', // Music category
          maxResults: 20,
          key: YOUTUBE_API_KEY,
        },
      }
    )

    if (!response.data.items || response.data.items.length === 0) {
      return []
    }

    // Get video details for duration
    const videoIds = response.data.items.map((item: any) => item.id.videoId).join(',')
    const detailsResponse = await axios.get(
      'https://www.googleapis.com/youtube/v3/videos',
      {
        params: {
          part: 'contentDetails',
          id: videoIds,
          key: YOUTUBE_API_KEY,
        },
      }
    )

    return response.data.items.map((item: any, index: number) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium.url,
      duration: parseDuration(detailsResponse.data.items[index]?.contentDetails?.duration || 'PT0S'),
    }))
  } catch (error) {
    console.error('YouTube API error:', error)
    throw new Error('Failed to search YouTube')
  }
}

function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1]?.replace('H', '') || '0')
  const minutes = parseInt(match[2]?.replace('M', '') || '0')
  const seconds = parseInt(match[3]?.replace('S', '') || '0')
  
  return hours * 3600 + minutes * 60 + seconds
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
