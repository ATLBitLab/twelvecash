import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'
export const revalidate = 0
export const alt = 'TwelveCash User Profile'
export const size = {
  width: 1920,
  height: 1080,
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
            background: '#000000',
            color: '#ffffff',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            position: 'relative',
            fontFamily: 'Urbanist, sans-serif'
          }}
        >
          {/* Logotype */}
          <div style={{
              position: 'absolute',
              top: 36,
              right: 36,
              color: '#ffffff',
              fontSize: 48
          }}>
              TwelveCash
          </div>

          {/* Image */}
          <div style={{
            background: '#8cf506',
            width: 448,
            height: 448,
            color: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36
          }}>
            Placeholder for Image
          </div>


          <div>
            {/* Asterisk */}
            <p style={{
              fontSize: 200
            }}>
              *
            </p>

            {/* Slogan */}
            <p style={{
              fontSize: 80,
              fontWeight: 'bold',
              fontFamily: 'Urbanist, sans-serif',
              maxWidth: 800
            }}>
              The best bitcoin transaction ever?
            </p>

            {/* Username */}
            <div
              style={{
                display: 'flex',
                fontSize: 60,
                fontWeight: 'bold',
                color: '#000',
                marginBottom: 20,
                background: '#8cf506',
                borderRadius: 100,
                padding: 24,
                paddingLeft: 48,
                paddingRight: 48,
              }}
            >
              {user}@{domain && domain}
            </div>
          </div>

          {/* Legal Text */}
          <div style={{
              position: 'absolute',
              bottom: 36,
              left: 36,
              color: '#ffffff',
              fontSize: 24
          }}>
            No rights reserved! Freedom forever!&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Try TwelveCash now. Like right now.
          </div>
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