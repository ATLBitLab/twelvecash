import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'
export const revalidate = 0
export const alt = 'TwelveCash User Profile'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

// Add error handling
export default async function Image({ params }: { params: { user: string } }) {
  try {
    const decoded = decodeURIComponent(params.user)
    const [user, domain] = decoded.split("@")

    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(to bottom right, #4c1d95, #2e1065)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 60,
              fontWeight: 'bold',
              color: 'white',
              marginBottom: 20,
            }}
          >
            {user}
          </div>
          {domain && (
            <div
              style={{
                display: 'flex',
                fontSize: 40,
                color: '#e4e4e7',
              }}
            >
              @{domain}
            </div>
          )}
        </div>
      ),
      {
        ...size,
      }
    )
  } catch (e) {
    console.error('Error generating image:', e)
    return new Response('Failed to generate image', { status: 500 })
  }
} 