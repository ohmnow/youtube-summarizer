import { OpenAI } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_AI_API_KEY,
});

export async function createCompletion(prompt: string) {
  return await openai.chat.completions.create({
    model: process.env.NEXT_PUBLIC_AI_MODEL || 'claude-3-haiku-20240307',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1500,
  });
} 