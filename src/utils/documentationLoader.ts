/**
 * Documentation loader utility
 * Scans the Documentation folder and builds a navigation tree
 */

export interface DocFile {
  name: string;
  path: string;
  route: string;
  isFile: boolean;
}

export interface DocFolder {
  name: string;
  path: string;
  route: string;
  children: (DocFile | DocFolder)[];
  isFile: boolean;
}

export type DocNode = DocFile | DocFolder;

/**
 * Converts a file path to a URL-friendly route
 */
function pathToRoute(path: string): string {
  return path
    .replace(/^Documentation\//, '')
    .replace(/\.md$/, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Builds documentation navigation tree from a list of file paths
 * This will be populated at build time or runtime
 */
export function buildDocTree(filePaths: string[]): DocNode[] {
  const tree: DocNode[] = [];
  const nodeMap = new Map<string, DocFolder>();

  // Sort paths to ensure parent folders are processed first
  const sortedPaths = [...filePaths].sort();

  for (const filePath of sortedPaths) {
    const parts = filePath.replace(/^Documentation\//, '').split('/');
    const isFile = parts[parts.length - 1].endsWith('.md');
    
    let currentPath = 'Documentation';
    let parentNode: DocFolder | null = null;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLastPart = i === parts.length - 1;
      const isCurrentFile = isLastPart && isFile;
      
      currentPath += `/${part}`;
      const route = pathToRoute(currentPath);

      if (isCurrentFile) {
        // This is a file
        const fileName = part.replace(/\.md$/, '');
        const file: DocFile = {
          name: fileName,
          path: currentPath,
          route: `/docs/${route}`,
          isFile: true
        };

        if (parentNode) {
          parentNode.children.push(file);
        } else {
          tree.push(file);
        }
      } else {
        // This is a folder
        if (!nodeMap.has(currentPath)) {
          const folder: DocFolder = {
            name: part,
            path: currentPath,
            route: `/docs/${route}`,
            children: [],
            isFile: false
          };
          nodeMap.set(currentPath, folder);

          if (parentNode) {
            parentNode.children.push(folder);
          } else {
            tree.push(folder);
          }
        }
        parentNode = nodeMap.get(currentPath)!;
      }
    }
  }

  return tree;
}

/**
 * Gets all markdown files from the Documentation folder
 * Returns a hardcoded list of known documentation files
 * In production, this could be generated at build time or fetched from an API
 */
export async function getDocFiles(): Promise<string[]> {
  // Return known documentation files
  // This could be replaced with a build-time manifest or API call
  return [
    'Documentation/README.md',
    'Documentation/Process/Discovery.md',
    'Documentation/Process/Web Development.md'
  ];
}

/**
 * Loads a markdown file content by fetching it
 */
export async function loadDocFile(route: string): Promise<string | null> {
  try {
    // Convert route back to file path
    // Route format: /docs/process/discovery
    const pathParts = route
      .replace(/^\/docs\//, '')
      .split('/')
      .map(part => {
        // Convert kebab-case back to Title Case
        return part
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      });

    // Build file path
    const fileName = pathParts[pathParts.length - 1] + '.md';
    const folderPath = pathParts.slice(0, -1).join('/');
    const filePath = folderPath 
      ? `/Documentation/${folderPath}/${fileName}`
      : `/Documentation/${fileName}`;

    // Fetch the markdown file
    try {
      const response = await fetch(filePath);
      if (response.ok) {
        return await response.text();
      }
    } catch (fetchError) {
      console.error('Error fetching doc file:', fetchError);
    }

    // Fallback: try to match known files
    const knownFiles: Record<string, string> = {
      '/docs/readme': '/Documentation/README.md',
      '/docs/process/discovery': '/Documentation/Process/Discovery.md',
      '/docs/process/web-development': '/Documentation/Process/Web Development.md',
    };

    const fallbackPath = knownFiles[route.toLowerCase()];
    if (fallbackPath) {
      const response = await fetch(fallbackPath);
      if (response.ok) {
        return await response.text();
      }
    }

    return null;
  } catch (error) {
    console.error('Error loading doc file:', error);
    return null;
  }
}

