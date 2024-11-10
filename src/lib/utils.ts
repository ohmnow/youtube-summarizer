import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${padZero(minutes)}:${padZero(remainingSeconds)}`
  }
  return `${minutes}:${padZero(remainingSeconds)}`
}

function padZero(num: number): string {
  return num.toString().padStart(2, '0')
}

export function getYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    /^[a-zA-Z0-9_-]{11}$/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat('en-US', { 
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(num)
}