import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse: any) => {
    try {
      await login(credentialResponse.credential);
      navigate('/');
    } catch (error: any) {
      alert(error.message || 'Login failed. Please try again.');
    }
  };

  const handleError = () => {
    alert('Login failed. Please try again.');
  };

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Configuration Error
          </h1>
          <p className="text-gray-600">
            Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quoting Tool
          </h1>
          <p className="text-gray-600 mb-8">
            Sign in with your creode.co.uk email address
          </p>
        </div>
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap={false}
          />
        </div>
        <p className="text-xs text-gray-500 text-center mt-4">
          Access is restricted to creode.co.uk email addresses
        </p>
      </div>
    </div>
  );
}

