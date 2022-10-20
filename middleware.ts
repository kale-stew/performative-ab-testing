import { NextRequest, NextResponse } from 'next/server'
import { getBucket } from 'lib/ab-test'
import { ABOUT_BUCKETS } from 'lib/buckets'

type Route = {
  page: string
  cookie: string
  buckets: readonly string[]
}

const ROUTES: Record<string, Route | undefined> = {
  '/about': {
    page: '/about',
    cookie: 'bucket-about',
    buckets: ABOUT_BUCKETS,
  },
}

export const config = {
  matcher: ['/about'],
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const route = ROUTES[pathname]

  if (!route) return

  // Get the bucket from the cookie
  let bucket = req.cookies.get(route.cookie)
  let hasBucket = !!bucket

  // If there's no active bucket in cookies or the value is invalid, get a new one
  if (!bucket || !route.buckets.includes(bucket as any)) {
    bucket = getBucket(route.buckets)
    hasBucket = false
  }

  // Create a rewrite to the page matching the bucket
  const url = req.nextUrl.clone()
  url.pathname = `${route.page}/${bucket}`
  const res = NextResponse.rewrite(url)

  // Add bucket to the response cookies if it's not there or invalid
  if (!hasBucket) {
    res.cookies.set(route.cookie, bucket)
  }

  return res
}
