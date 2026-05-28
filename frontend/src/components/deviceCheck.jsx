import { useEffect, useState } from 'react';
import { Smartphone, AlertCircle } from 'lucide-react';

export default function DeviceCheck({ children }) {
  const [isCompatible, setIsCompatible] = useState(null);

  useEffect(() => {
    const checkDevice = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

      const isMobileWidth = window.innerWidth <= 768;

      setIsCompatible(isMobile && isMobileWidth);
    };

    // Check device saat pertama kali load
    checkDevice();

    // Listen ke resize event untuk deteksi jika window di-resize
    window.addEventListener('resize', checkDevice);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  if (isCompatible === null) {
    return null;
  }

  if (!isCompatible) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
        <div className="text-center bg-white p-5 rounded-3 shadow-lg" style={{ maxWidth: '400px' }}>
          <div className="mb-4">
            <AlertCircle size={80} className="text-danger mx-auto d-block" strokeWidth={1.5} />
          </div>
          <h2 className="mb-3 text-dark fw-bold">Device Tidak Kompatibel</h2>
          <p className="text-muted mb-4" style={{ fontSize: '16px', lineHeight: '1.6' }}>
            Aplikasi ini hanya dapat diakses melalui smartphone atau tablet
          </p>
          <div className="bg-light p-3 rounded-2 mb-4">
            <div className="d-flex align-items-center gap-2 justify-content-center text-primary">
              <Smartphone size={24} />
              <span className="fw-semibold">Gunakan Mobile Device</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
