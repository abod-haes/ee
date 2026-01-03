import axiosInstance from "@/lib/axios";
import type {
  Doctor,
  CreateDoctorRequest,
  UpdateDoctorRequest,
  PaginationParams,
  PaginatedDoctorsResponse,
} from "@/types/doctor.type";
import { API_BASE_URL } from "@/api";
import type { ApiResponse } from "@/types/common.type";

// Get all doctors
export const getAllDoctors = async (
  params?: PaginationParams
): Promise<Doctor[]> => {
  const { data } = await axiosInstance.get<ApiResponse<Doctor[]>>(
    `${API_BASE_URL}/doctors`,
    {
      params,
    }
  );
  return data.data;
};

// Get doctor by ID
export const getDoctorById = async (id: number | string): Promise<Doctor> => {
  const { data } = await axiosInstance.get<ApiResponse<Doctor>>(
    `${API_BASE_URL}/doctors/${id}`
  );
  return data.data;
};

// Create new doctor
export const createDoctor = async (
  doctorData: CreateDoctorRequest
): Promise<Doctor> => {
  const { data } = await axiosInstance.post<ApiResponse<Doctor>>(
    `${API_BASE_URL}/doctors`,
    doctorData
  );
  return data.data;
};

// Update doctor
export const updateDoctor = async (
  id: number | string,
  doctorData: UpdateDoctorRequest
): Promise<Doctor> => {
  const { data } = await axiosInstance.put<ApiResponse<Doctor>>(
    `${API_BASE_URL}/doctors/${id}`,
    doctorData
  );
  return data.data;
};

// Delete doctor
export const deleteDoctor = async (id: number | string): Promise<void> => {
  await axiosInstance.delete<ApiResponse<void>>(
    `${API_BASE_URL}/doctors/${id}`
  );
};

// Get paginated doctors
export const getPaginatedDoctors = async (
  params: PaginationParams
): Promise<PaginatedDoctorsResponse> => {
  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedDoctorsResponse>
  >(`${API_BASE_URL}/doctors/paginated`, {
    params,
  });
  return data.data;
};

// Search doctors
export const searchDoctors = async (query: string): Promise<Doctor[]> => {
  const { data } = await axiosInstance.get<ApiResponse<Doctor[]>>(
    `${API_BASE_URL}/doctors`,
    {
      params: { text: query },
    }
  );
  return data.data;
};

// Toggle doctor active status
export const toggleDoctorStatus = async (
  id: number | string
): Promise<Doctor> => {
  const { data } = await axiosInstance.patch<ApiResponse<Doctor>>(
    `${API_BASE_URL}/doctors/${id}/toggle-status`
  );
  return data.data;
};
