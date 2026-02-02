import { Heart, CloudRain } from 'lucide-react';

export default function About() {
  return (
    <div className="page" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: 32,
    }}>
      <div style={{
        fontSize: 48,
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <CloudRain size={36} style={{ color: '#9ca3af' }} />
        <Heart size={32} style={{ color: '#ec4899' }} />
      </div>

      <h1 style={{
        fontSize: 20,
        fontWeight: 600,
        marginBottom: 16,
        color: '#374151',
      }}>
        Gim app
      </h1>

      <p style={{
        fontSize: 15,
        color: '#6b7280',
        maxWidth: 280,
        lineHeight: 1.6,
        marginBottom: 24,
      }}>
        This little app was born on a cloudy winter afternoon in Brussels,
        made with love by two people cuddled up on the sofa.
      </p>

      <div style={{
        fontSize: 13,
        color: '#9ca3af',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span>Made with</span>
        <Heart size={14} style={{ color: '#ec4899', fill: '#ec4899' }} />
        <span>in Brussels</span>
      </div>

      <div style={{
        marginTop: 32,
        fontSize: 12,
        color: '#d1d5db',
      }}>
        2026
      </div>
    </div>
  );
}
