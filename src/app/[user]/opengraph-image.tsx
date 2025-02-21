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
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 48,
            paddingBottom: 300,
            paddingTop: 300,
            position: 'relative',
            fontFamily: 'Urbanist, sans-serif',
            gap: 48
          }}
        >
          {/* Logotype */}
          <div style={{
              position: 'absolute',
              top: 36,
              right: 36,
              color: '#ffffff',
              fontSize: 48,
              display: 'flex'
          }}>
              TwelveCash
          </div>

          {/* Image */}
          <div style={{
            background: '#8cf506',
            width: 500,
            height: 500,
            color: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36
          }}>
            Placeholder for Image
          </div>

          {/* Content Container */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}>
            {/* Asterisk */}
            <p style={{
              fontSize: 200,
              display: 'flex',
              margin: 0,
              position: 'absolute',
              left: -112,
              top: -124
            }}>
              *
            </p>

            {/* Slogan */}
            <p style={{
              fontSize: 80,
              fontWeight: 'bold',
              fontFamily: 'Urbanist, sans-serif',
              maxWidth: 800,
              display: 'flex',
              margin: 0
            }}>
              The best bitcoin transaction ever?
            </p>

            {/* Username */}
            <div style={{
              display: 'flex',
              flexDirection: 'row'
            }}>
              <p
                style={{
                  fontSize: 60,
                  fontWeight: 'bold',
                  color: '#000',
                  marginBottom: 20,
                  background: '#8cf506',
                  borderRadius: 100,
                  padding: 24,
                  paddingLeft: 48,
                  paddingRight: 48,
                  flex: 'none'
                }}
              >
                {user}@{domain && domain}
              </p>
            </div>
          </div>

          {/* Legal Text */}
          <div style={{
              position: 'absolute',
              bottom: 36,
              left: 36,
              color: '#ffffff',
              fontSize: 24,
              display: 'flex'
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