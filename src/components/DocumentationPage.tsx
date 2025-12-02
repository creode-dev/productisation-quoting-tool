import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DocumentationViewer } from './DocumentationViewer';
import { loadDocFile } from '../utils/documentationLoader';

export function DocumentationPage() {
  const { '*': path } = useParams<{ '*': string }>();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContent() {
      if (!path) {
        setError('No documentation path specified');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const fullRoute = `/docs/${path}`;
        console.log('Loading documentation from route:', fullRoute);
        const docContent = await loadDocFile(fullRoute);
        if (docContent) {
          setContent(docContent);
        } else {
          console.error('Documentation not found for route:', fullRoute);
          setError(`Documentation not found: ${path}`);
        }
      } catch (err) {
        console.error('Error loading documentation:', err);
        setError('Failed to load documentation');
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [path]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading documentation...</div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Documentation Not Found</h1>
        <p className="text-gray-600 mb-6">{error || 'The requested documentation could not be found.'}</p>
        <Link
          to="/"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <DocumentationViewer content={content} />
    </div>
  );
}

