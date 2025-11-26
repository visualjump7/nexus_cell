import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Auth disabled for testing - just allow everything
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};