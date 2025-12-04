import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const navigate = useNavigate();

  const handleContinue = () => {
    // For now, just navigate to the app without authentication
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quoting Tool
          </h1>
          <p className="text-gray-600 mb-8">
            Authentication is temporarily disabled
          </p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Continue to Application
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center mt-4">
          Google OAuth login will be implemented in the future
        </p>
      </div>
    </div>
  );
}


