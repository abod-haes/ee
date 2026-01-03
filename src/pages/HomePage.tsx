import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/products', { replace: true });
  }, [navigate]);

  return null;
}
