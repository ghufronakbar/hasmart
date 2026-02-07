import { axiosInstance } from "@/lib/axios";

export const backupRestoreService = {
  downloadBackup: async () => {
    // We request 'blob' to handle file download
    const response = await axiosInstance.get("/data/backup", {
      responseType: "blob",
    });
    return response;
  },

  restoreDatabase: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post<{ message: string }>(
      "/data/restore",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },
};
