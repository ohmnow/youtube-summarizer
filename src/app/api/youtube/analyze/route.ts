import { NextResponse } from 'next/server';
import { createCompletion } from '@/lib/ai-service';
import { getYoutubeTranscript } from '@/lib/youtube';

export async function POST(request: Request) {
  try {
    const { videoId } = await request.json();
    
    const transcript = await getYoutubeTranscript(videoId);
    
    if (!transcript) {
      return NextResponse.json(
        { error: 'No transcript available for this video' },
        { status: 400 }
      );
    }

    const prompt = `Summarize the following YouTube video transcript and provide a JSON object with the following structure:
    {
      "videoTitle": "string",
      "bluf": "string",
      "tldr": ["string"],
      "executiveSummary": {
        "overview": "string",
        "sections": [
          {
            "title": "string",
            "content": "string"
          }
        ]
      },
      "keyQuotes": [
        {
          "quote": "string",
          "context": "string"
        }
      ],
      "qualityScore": {
        "informational": number,
        "salesly": number,
        "analysis": "string"
      }
    }

    For executiveSummary, break down the content into logical sections with headers. Use markdown formatting for emphasis where appropriate. Each section should have a clear title and detailed content.

    For keyQuotes, extract 3-5 significant quotes from the transcript that capture key moments or insights. Include a brief context for each quote.

    For qualityScore:
    - informational: Rate from 1-10 how informative and educational the content is
    - salesly: Rate from 1-10 how sales-focused or promotional the content is
    - analysis: Provide a brief analysis of the content quality and target audience

    Do not include any markdown formatting or code blocks. Return only the JSON object.

    Transcript:
    ${transcript}`;

    const completion = await createCompletion(prompt);
    const response = completion.choices[0].message.content;
    
    // Enhanced cleaning of the response string
    const cleanResponse = response ? response
      .replace(/```json\n?|\n?```/g, '')  // Remove code block markers
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\n/g, '\\n')  // Escape newlines
      .trim() : '';

    try {
      const analysis = JSON.parse(cleanResponse);
      return NextResponse.json(analysis);
    } catch (error) {
      console.error('Raw response:', response);
      console.error('Cleaned response:', cleanResponse);
      console.error('JSON parsing error:', error);
      return NextResponse.json(
        { error: 'Failed to parse analysis results' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('JSON parsing error:', error, 'Response:', Response);
    return NextResponse.json(
      { error: 'Failed to parse analysis results' },
      { status: 500 }
    );
  }
} 