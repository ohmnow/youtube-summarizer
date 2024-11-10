'use client';

import React, { useState, useEffect } from 'react';
import { UtilityAppLayout, useApiConfig, useAnalytics } from './app-architecture';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Youtube, Eye, Clock, Quote } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import ReactMarkdown from 'react-markdown';

// Types
interface VideoInfo {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; };
      medium: { url: string; };
      high: { url: string; };
    };
    channelTitle: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
  };
  contentDetails: {
    duration: string;
  };
}

interface AnalysisResult {
  videoTitle: string;
  bluf: string;
  tldr: string[];
  executiveSummary: {
    overview: string;
    sections: {
      title: string;
      content: string;
    }[];
  };
  keyQuotes: {
    quote: string;
    context: string;
  }[];
  qualityScore: {
    informational: number;
    salesly: number;
    analysis: string;
  };
}

// interface RelatedVideo {
//   id: {
//     videoId: string;
//   };
//   snippet: {
//     title: string;
//     thumbnails: {
//       default: { url: string; };
//     };
//     channelTitle: string;
//   };
// }

// Add this helper function before the YouTubeSummarizer component
const formatDuration = (duration: string): string => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  
  const hours = (match && match[1] || '').replace('H', '');
  const minutes = (match && match[2] || '').replace('M', '');
  const seconds = (match && match[3] || '').replace('S', '');

  const parts = [
    hours ? hours.padStart(2, '0') : '',
    minutes.padStart(2, '0'),
    seconds.padStart(2, '0')
  ].filter(Boolean);

  return parts.join(':');
};

const YouTubeSummarizer = () => {
  // Hooks
  const { toast } = useToast();
  const { config } = useApiConfig();
  const { trackEvent, trackError } = useAnalytics();

  // Debug log for API key
  useEffect(() => {
    console.log('YouTube API Configuration:', {
      hasKey: !!config.youtubeApiKey,
      keyLength: config.youtubeApiKey?.length,
      isDefined: typeof config.youtubeApiKey !== 'undefined'
    });
  }, [config.youtubeApiKey]);

  // State
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<'idle' | 'transcript' | 'analyzing' | 'done'>('idle');
  const [progressValue, setProgressValue] = useState(0);

  // Extract video ID from URL
  const getYoutubeVideoId = (url: string): string | null => {
    try {
      // Handle empty or invalid input
      if (!url) {
        console.log('Empty URL provided');
        return null;
      }

      // Handle different URL formats
      if (url.includes('youtu.be/')) {
        // Short URL format: youtu.be/xxxxxxxxxxx
        const id = url.split('youtu.be/')[1]?.split(/[/?#]/)[0];
        console.log('Extracted ID from short URL:', id);
        return id || null;
      } else if (url.includes('youtube.com')) {
        // Regular URL format: youtube.com/watch?v=xxxxxxxxxxx
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const id = urlParams.get('v');
        console.log('Extracted ID from full URL:', id);
        return id || null;
      } else if (/^[A-Za-z0-9_-]{11}$/.test(url)) {
        // Direct video ID
        console.log('Using direct video ID:', url);
        return url;
      }

      console.log('No valid YouTube video ID found');
      return null;
    } catch (error) {
      console.error('Error parsing YouTube URL:', error);
      return null;
    }
  };

  // Fetch video info
  const fetchVideoInfo = async (videoId: string): Promise<VideoInfo> => {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${config.youtubeApiKey}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch video info');
    }

    const data = await response.json();
    return data.items[0];
  };

  // Handle URL change
  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    const videoId = getYoutubeVideoId(newUrl);
    if (videoId) {
      try {
        const info = await fetchVideoInfo(videoId);
        setVideoInfo(info);
      } catch (error) {
        console.error('Error in handleUrlChange:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch video information",
        });
      }
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setLoading(true);
    setAnalysisStep('transcript');
    
    try {
      const videoId = getYoutubeVideoId(url);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      trackEvent('video_analysis_started', { videoId });

      // Fetch analysis
      setAnalysisStep('analyzing');
      const response = await fetch('/api/youtube/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const analysisResult = await response.json();
      setAnalysis(analysisResult);
      setAnalysisStep('done');
      
      toast({
        title: "Analysis Complete",
        description: "Your video summary is ready!",
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
      trackError(error as Error);
      setAnalysisStep('idle');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: string): string => {
    return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(Number(num));
  };

  const getProgressValue = (step: 'idle' | 'transcript' | 'analyzing' | 'done'): number => {
    switch (step) {
      case 'idle': return 0;
      case 'transcript': return 33;
      case 'analyzing': return progressValue;
      case 'done': return 100;
      default: return 0;
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (analysisStep === 'analyzing') {
      // Start at 33 (transcript phase complete)
      setProgressValue(33);
      
      interval = setInterval(() => {
        setProgressValue(prev => {
          // Slowly increase up to 95%
          if (prev < 95) {
            return prev + 0.5;
          }
          return prev;
        });
      }, 300);
    } else if (analysisStep === 'done') {
      setProgressValue(100);
    } else if (analysisStep === 'idle') {
      setProgressValue(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [analysisStep]);

  return (
    <UtilityAppLayout>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="text-red-600" />
            YouTube Video Transcript Summarizer
          </CardTitle>
              <CardDescription className="pl-8">
                Get AI-powered summaries, insights, and analysis from YouTube video transcripts
              </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* URL Input */}
          <div className="flex space-x-2">
            <Input
              value={url}
              onChange={handleUrlChange}
              placeholder="Paste YouTube URL here..."
              className="flex-1"
              disabled={loading}
            />
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>

          {/* Video Info */}
          {videoInfo && (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoInfo.id}`}
                  allowFullScreen
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">{videoInfo.snippet.title}</h3>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {videoInfo.snippet.channelTitle}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      <Eye className="w-4 h-4 mr-1" />
                      {formatNumber(videoInfo.statistics.viewCount)}
                    </Badge>
                    <Badge variant="secondary">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDuration(videoInfo.contentDetails.duration)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Status */}
          {loading && (
            <div className="space-y-4">
              <Progress 
                value={getProgressValue(analysisStep)} 
                className="w-full transition-all duration-500 ease-in-out progress-bar-animation"
              />
            </div>
          )}

          {/* Analysis Results */}
          {analysis && analysisStep === 'done' && (
            <Tabs defaultValue="bluf" className="w-full">
              <TabsList>
                <TabsTrigger value="bluf">BLUF</TabsTrigger>
                <TabsTrigger value="tldr">TL;DR</TabsTrigger>
                <TabsTrigger value="summary">Video Summary</TabsTrigger>
                <TabsTrigger value="quotes">Key Quotes</TabsTrigger>
                <TabsTrigger value="quality">Quality Score</TabsTrigger>
              </TabsList>

              <TabsContent value="bluf">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {analysis.bluf}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="tldr">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {analysis.tldr.map((point, index) => (
                      <div key={index} className="p-2 rounded-lg bg-muted">
                        {point}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="summary" className="space-y-4">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    <div className="prose dark:prose-invert max-w-none">
                      <h3>Overview</h3>
                      <ReactMarkdown>{analysis.executiveSummary.overview}</ReactMarkdown>
                      
                      {analysis.executiveSummary.sections.map((section, index) => (
                        <div key={index} className="mt-4">
                          <h4>{section.title}</h4>
                          <ReactMarkdown>{section.content}</ReactMarkdown>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="quotes">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {analysis.keyQuotes.map((item, index) => (
                      <div key={index} className="p-4 rounded-lg bg-muted space-y-2">
                        <div className="flex items-start gap-2">
                          <Quote className="w-4 h-4 mt-1 text-muted-foreground" />
                          <p className="font-medium italic">{item.quote}</p>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">
                          {item.context}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="quality">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted">
                      <h3 className="text-lg font-semibold mb-4">Content Quality Score</h3>
                      <div className="flex items-center justify-between mb-2">
                        <span>Informational Value:</span>
                        <Badge variant="secondary">{analysis.qualityScore?.informational}/10</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Sales Focus:</span>
                        <Badge variant="secondary">{analysis.qualityScore?.salesly}/10</Badge>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">
                          {analysis.qualityScore?.analysis}
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </UtilityAppLayout>
  );
};

export default YouTubeSummarizer;