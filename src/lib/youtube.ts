import { YoutubeTranscript } from 'youtube-transcript';

export async function getYoutubeTranscript(videoId: string): Promise<string | null> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript.map((item: { text: string }) => item.text).join(' ');
  } catch (error) {
    console.error('Failed to fetch transcript:', error);
    return null;
  }
} 