// Helper function to create Basic Auth header
export const createBasicAuthHeader = (username: string, password: string) => {
  const credentials = btoa(`${username}:${password}`);
  return `Basic ${credentials}`;
};
