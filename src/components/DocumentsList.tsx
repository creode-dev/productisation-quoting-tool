import { useEffect, useState } from 'react';
import { documentsAPI } from '../utils/api';
import { format } from 'date-fns';

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  mime_type?: string;
  file_size?: number;
  uploaded_at: string;
}

export function DocumentsList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { documents: docs } = await documentsAPI.getMe();
      setDocuments(docs);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await documentsAPI.delete(id);
      await fetchDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete document');
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const { downloadLink } = await documentsAPI.getDownloadLink(id);
      window.open(downloadLink, '_blank');
    } catch (err: any) {
      alert(err.message || 'Failed to get download link');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return <div className="text-center text-gray-600">Loading documents...</div>;
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {documents.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No documents uploaded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{doc.file_name}</span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                    {getDocumentTypeLabel(doc.document_type)}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {formatFileSize(doc.file_size)} •{' '}
                  {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(doc.id)}
                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                >
                  Download
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


