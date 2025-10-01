import { getToken } from './authApi';
import { apiConfig } from './config';

export type ProfileData = {
  first_name?: string;
  last_name?: string;
  email: string;
  profilePicture?: string;
  // Add other profile fields as needed
};

/**
 * Fetches the user profile from the backend
 * @returns The user profile data
 */
export const getProfile = async (): Promise<ProfileData> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${apiConfig.baseUrl}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

/**
 * Updates the user profile on the backend
 * @param profileData The profile data to update
 * @returns The updated profile data
 */
export const updateProfile = async (profileData: Partial<ProfileData>): Promise<ProfileData> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    const body = JSON.stringify(profileData);

    console.log('Updating profile with body:', body);
    const response = await fetch(`${apiConfig.baseUrl}/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Failed to update profile: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};
