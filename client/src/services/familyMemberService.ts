import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api`;

export interface FamilyMember {
  _id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFamilyMemberRequest {
  name: string;
}

export interface UpdateFamilyMemberRequest {
  name: string;
}

const familyMemberService = {
  /**
   * Get all family members for the authenticated user
   */
  getFamilyMembers: async (): Promise<FamilyMember[]> => {
    const response = await axios.get(`${API_URL}/family-members`, {
      withCredentials: true,
    });
    return response.data;
  },

  /**
   * Create a new family member
   */
  createFamilyMember: async (data: CreateFamilyMemberRequest): Promise<FamilyMember> => {
    const response = await axios.post(`${API_URL}/family-members`, data, {
      withCredentials: true,
    });
    return response.data;
  },

  /**
   * Update a family member
   */
  updateFamilyMember: async (
    id: string,
    data: UpdateFamilyMemberRequest
  ): Promise<FamilyMember> => {
    const response = await axios.put(`${API_URL}/family-members/${id}`, data, {
      withCredentials: true,
    });
    return response.data;
  },

  /**
   * Delete a family member
   */
  deleteFamilyMember: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/family-members/${id}`, {
      withCredentials: true,
    });
  },
};

export default familyMemberService;
