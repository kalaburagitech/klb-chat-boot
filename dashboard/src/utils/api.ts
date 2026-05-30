const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4005/api/v1';

export const api = {
  get: async (endpoint: string) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'x-org-id': 'klb-connect'
      }
    });
    if (!res.ok) throw new Error('API Request Failed');
    return res.json();
  },
  
  post: async (endpoint: string, data: any) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-org-id': 'klb-connect'
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('API Request Failed');
    return res.json();
  }
};
