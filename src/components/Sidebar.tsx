import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSidebarStore } from '../store/sidebarStore';
import { useAuth } from '../contexts/AuthContext';
import { DocNode, DocFolder, DocFile, getDocFiles, buildDocTree } from '../utils/documentationLoader';

interface SidebarProps {
  className?: string;
}

function NavItem({ node, level = 0 }: { node: DocNode; level?: number }) {
  const location = useLocation();
  const { isFolderExpanded, toggleFolder } = useSidebarStore();
  const [isExpanded, setIsExpanded] = useState(level === 0); // Top level expanded by default

  useEffect(() => {
    if (node.isFile) return;
    setIsExpanded(isFolderExpanded(node.path));
  }, [node, isFolderExpanded]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!node.isFile) {
      toggleFolder(node.path);
      setIsExpanded(!isExpanded);
    }
  };

  if (node.isFile) {
    const file = node as DocFile;
    const isActive = location.pathname === file.route;
    return (
      <Link
        to={file.route}
        className={`block py-2 px-4 text-sm hover:bg-gray-100 transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-600'
            : 'text-gray-700'
        }`}
        style={{ paddingLeft: `${16 + level * 16}px` }}
      >
        {file.name}
      </Link>
    );
  }

  const folder = node as DocFolder;
  const hasChildren = folder.children.length > 0;

  return (
    <div>
      <button
        onClick={handleToggle}
        className={`w-full flex items-center justify-between py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors ${
          hasChildren ? 'cursor-pointer' : 'cursor-default'
        }`}
        style={{ paddingLeft: `${16 + level * 16}px` }}
      >
        <span className="flex items-center">
          {hasChildren && (
            <svg
              className={`w-4 h-4 mr-2 transition-transform ${
                isExpanded ? 'transform rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
          {folder.name}
        </span>
      </button>
      {hasChildren && isExpanded && (
        <div>
          {folder.children.map((child, index) => (
            <NavItem key={`${child.path}-${index}`} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ className = '' }: SidebarProps) {
  const { isOpen, toggleSidebar } = useSidebarStore();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [docTree, setDocTree] = useState<DocNode[]>([]);
  const [loading, setLoading] = useState(true);
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    async function loadDocs() {
      try {
        const files = await getDocFiles();
        const tree = buildDocTree(files);
        setDocTree(tree);
      } catch (error) {
        console.error('Error loading documentation:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDocs();
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${
          isOpen ? 'w-64' : 'w-0 lg:w-16'
        } ${className}`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 min-h-[64px]">
            {isOpen ? (
              <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
            ) : (
              <div className="w-5 h-5"></div>
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {loading ? (
              <div className="px-4 py-8 text-center text-gray-500">Loading...</div>
            ) : (
              <>
                {isAuthenticated && (
                  <>
                    {isOpen && (
                      <div className="px-4 pb-2 mb-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Main
                        </h3>
                      </div>
                    )}
                    <div className="mb-4">
                      <Link
                        to="/"
                        className={`flex items-center gap-2 py-2 px-4 text-sm hover:bg-gray-100 transition-colors ${
                          location.pathname === '/'
                            ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-600'
                            : 'text-gray-700'
                        }`}
                      >
                        {isOpen ? (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Quoting Tool</span>
                          </>
                        ) : (
                          '📝'
                        )}
                      </Link>
                      <Link
                        to="/quotes"
                        className={`flex items-center gap-2 py-2 px-4 text-sm hover:bg-gray-100 transition-colors ${
                          location.pathname.startsWith('/quotes')
                            ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-600'
                            : 'text-gray-700'
                        }`}
                      >
                        {isOpen ? (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>Quotes</span>
                          </>
                        ) : (
                          '📋'
                        )}
                      </Link>
                      <Link
                        to="/portal"
                        className={`flex items-center gap-2 py-2 px-4 text-sm hover:bg-gray-100 transition-colors ${
                          location.pathname.startsWith('/portal')
                            ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-600'
                            : 'text-gray-700'
                        }`}
                      >
                        {isOpen ? (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Employee Portal</span>
                          </>
                        ) : (
                          '👤'
                        )}
                      </Link>
                      <Link
                        to="/audit"
                        className={`flex items-center gap-2 py-2 px-4 text-sm hover:bg-gray-100 transition-colors ${
                          location.pathname.startsWith('/audit')
                            ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-600'
                            : 'text-gray-700'
                        }`}
                      >
                        {isOpen ? (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Audit Logs</span>
                          </>
                        ) : (
                          '📊'
                        )}
                      </Link>
                    </div>
                  </>
                )}
                {isOpen && (
                  <>
                    <div className="px-4 pb-2 mt-4">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Documentation
                      </h3>
                    </div>
                    <div>
                      {docTree.map((node, index) => (
                        <NavItem key={`${node.path}-${index}`} node={node} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </nav>
          
          {/* User Info & Logout */}
          {isAuthenticated && user && (
            <div className="border-t border-gray-200 p-4">
              {isOpen ? (
                <>
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogout}
                  className="w-full p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="Logout"
                >
                  <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Spacer for desktop */}
      <div className={`hidden lg:block transition-all duration-300 ${isOpen ? 'w-64' : 'w-16'}`} />
    </>
  );
}

