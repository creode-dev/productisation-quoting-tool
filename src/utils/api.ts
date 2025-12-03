const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const authAPI = {
  login: async (credential: string) => {
    return fetchAPI('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
  },

  getCurrentUser: async () => {
    return fetchAPI('/auth/me');
  },

  logout: async () => {
    return fetchAPI('/auth/logout', {
      method: 'POST',
    });
  },
};

export const quotesAPI = {
  getAll: async () => {
    return fetchAPI('/quotes');
  },

  getById: async (id: string) => {
    return fetchAPI(`/quotes?id=${id}`);
  },

  create: async (quote: {
    companyName: string;
    companyXeroId?: string;
    projectName: string;
    businessUnit?: string;
    targetCompletionDate?: string;
    quoteData: any;
  }) => {
    return fetchAPI('/quotes', {
      method: 'POST',
      body: JSON.stringify(quote),
    });
  },

  update: async (id: string, updates: any) => {
    return fetchAPI(`/quotes?id=${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string) => {
    return fetchAPI(`/quotes?id=${id}`, {
      method: 'DELETE',
    });
  },

  accept: async (id: string) => {
    return fetchAPI(`/quotes?id=${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'accept' }),
    });
  },
};

export const xeroAPI = {
  searchCompanies: async (query: string) => {
    return fetchAPI(`/xero/companies?q=${encodeURIComponent(query)}`);
  },
};

export const employeesAPI = {
  getMe: async () => {
    return fetchAPI('/employees?me=true');
  },

  updateMe: async (data: {
    name?: string;
    address?: string;
    phone?: string;
    nextOfKinName?: string;
    nextOfKinRelationship?: string;
    nextOfKinPhone?: string;
  }) => {
    return fetchAPI('/employees', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getAll: async () => {
    return fetchAPI('/employees');
  },

  getById: async (id: string) => {
    return fetchAPI(`/employees?id=${id}`);
  },

  update: async (id: string, data: any) => {
    return fetchAPI(`/employees?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

export const teamsAPI = {
  getAll: async () => {
    return fetchAPI('/teams');
  },

  create: async (data: { name: string; description?: string }) => {
    return fetchAPI('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: { name: string; description?: string }) => {
    return fetchAPI(`/teams?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return fetchAPI(`/teams?id=${id}`, {
      method: 'DELETE',
    });
  },
};

export const holidaysAPI = {
  getMe: async () => {
    return fetchAPI('/holidays?me=true');
  },

  getAll: async (filters?: { teamId?: string; status?: string; employeeId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.teamId) params.append('team_id', filters.teamId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.employeeId) params.append('employee_id', filters.employeeId);
    const query = params.toString();
    return fetchAPI(`/holidays${query ? `?${query}` : ''}`);
  },

  getById: async (id: string) => {
    return fetchAPI(`/holidays?id=${id}`);
  },

  create: async (data: {
    startDate: string;
    endDate: string;
    daysRequested: number;
  }) => {
    return fetchAPI('/holidays', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: {
    startDate?: string;
    endDate?: string;
    daysRequested?: number;
  }) => {
    return fetchAPI(`/holidays?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  cancel: async (id: string) => {
    return fetchAPI(`/holidays?id=${id}`, {
      method: 'DELETE',
    });
  },

  approve: async (id: string) => {
    return fetchAPI(`/holidays?id=${id}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'approve' }),
    });
  },

  reject: async (id: string, rejectionReason?: string) => {
    return fetchAPI(`/holidays?id=${id}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'reject', rejectionReason }),
    });
  },

  getRemaining: async () => {
    return fetchAPI('/holidays?remaining=true');
  },

  checkOverlaps: async (teamId: string, startDate: string, endDate: string, excludeRequestId?: string) => {
    const params = new URLSearchParams({
      overlaps: 'true',
      team_id: teamId,
      start_date: startDate,
      end_date: endDate,
    });
    if (excludeRequestId) params.append('exclude_request_id', excludeRequestId);
    return fetchAPI(`/holidays?${params.toString()}`);
  },
};

export const documentsAPI = {
  getMe: async () => {
    return fetchAPI('/documents?me=true');
  },

  upload: async (file: File, documentType: 'passport' | 'visa' | 'other') => {
    // Convert file to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64String = result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    return fetchAPI('/documents', {
      method: 'POST',
      body: JSON.stringify({
        fileContent: base64,
        fileName: file.name,
        mimeType: file.type,
        documentType,
      }),
    });
  },

  delete: async (id: string) => {
    return fetchAPI(`/documents?id=${id}`, {
      method: 'DELETE',
    });
  },

  getDownloadLink: async (id: string) => {
    return fetchAPI(`/documents?id=${id}`);
  },
};

