import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { prompt, aspectRatio } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Map aspect ratio to DALL-E sizes
    const sizeMap: Record<string, '1024x1024' | '1792x1024' | '1024x1792'> = {
      '1:1': '1024x1024',
      '16:9': '1792x1024',
      '21:9': '1792x1024', // DALL-E doesn't support 21:9, use closest
      '9:16': '1024x1792',
    };

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: sizeMap[aspectRatio] || '1792x1024',
      quality: 'hd',
      style: 'vivid',
    });

    if (!response.data || !response.data[0]) {
      return NextResponse.json(
        { success: false, error: 'No image data returned' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mediaUrl: response.data[0].url,
      revisedPrompt: response.data[0].revised_prompt,
    });
  } catch (error: any) {
    console.error('DALL-E generation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Generation failed' 
      },
      { status: 500 }
    );
  }
}
