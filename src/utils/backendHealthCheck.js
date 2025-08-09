// Create this file to test backend connectivity
export const checkBackendHealth = async () => {
  try {
    const backendUrl = import.meta.env?.VITE_BACKEND_API_URL;
    
    if (!backendUrl) {
      return { 
        status: 'error', 
        message: 'Backend URL not configured' 
      };
    }

    console.log(`Testing backend at: ${backendUrl}/health`);
    
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response?.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response?.json();
    
    return {
      status: 'success',
      data,
      message: `Backend healthy. Database: ${data?.database}`
    };
    
  } catch (error) {
    console.error('Backend health check failed:', error);
    
    return {
      status: 'error',
      message: error?.message,
      details: error?.name
    };
  }
};

export default checkBackendHealth;