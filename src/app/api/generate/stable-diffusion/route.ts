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

    // Using SDXL
    const output = await replicate.run(
      'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      {
        input: {
          prompt,
          negative_prompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
          width: dimensions.width,
          height: dimensions.height,
          num_outputs: 1,
          scheduler: 'K_EULER',
          num_inference_steps: 30,
          guidance_scale: 7.5,
          refine: 'expert_ensemble_refiner',
          high_noise_frac: 0.8,
        },
      }
    );

    // SDXL returns an array of URLs
    const mediaUrl = Array.isArray(output) ? output[0] : output;

    return NextResponse.json({
      success: true,
      mediaUrl,
    });
  } catch (error: any) {
    console.error('Stable Diffusion generation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Generation failed' 
      },
      { status: 500 }
    );
  }
}
