import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@/lib/supabase/server';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
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

    // Map aspect ratio to dimensions
    const dimensionMap: Record<string, { width: number; height: number }> = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1344, height: 768 },
      '21:9': { width: 1536, height: 640 },
      '9:16': { width: 768, height: 1344 },
    };

    const dimensions = dimensionMap[aspectRatio] || dimensionMap['16:9'];

    // Using Flux.1 Schnell (fast) or Dev (better quality)
    const output = await replicate.run(
      'black-forest-labs/flux-schnell',
      {
        input: {
          prompt,
          num_outputs: 1,
          aspect_ratio: aspectRatio === '1:1' ? '1:1' : 
                        aspectRatio === '9:16' ? '9:16' : 
                        aspectRatio === '21:9' ? '21:9' : '16:9',
          output_format: 'webp',
          output_quality: 90,
        },
      }
    );

    // Flux returns an array of URLs
    const mediaUrl = Array.isArray(output) ? output[0] : output;

    return NextResponse.json({
      success: true,
      mediaUrl,
    });
  } catch (error: any) {
    console.error('Flux generation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Generation failed' 
      },
      { status: 500 }
    );
  }
}
