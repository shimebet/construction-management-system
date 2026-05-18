import { api } from './client';

export type DocumentStatus =
  | 'WIP'
  | 'SHARED'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'REJECTED';

export type DocumentType =
  | 'DRAWING'
  | 'RFI'
  | 'SUBMITTAL'
  | 'METHOD_STATEMENT'
  | 'INSPECTION_REQUEST'
  | 'CONTRACT'
  | 'REPORT'
  | 'OTHER';

export type DocumentVersion = {
  id: number;
  documentId: number;
  revision: string;
  status: DocumentStatus;
  fileName: string;
  filePath: string;
  fileSize?: number | null;
  mimeType?: string | null;
  notes?: string | null;
  createdAt: string;
  uploadedBy?: {
    id: number;
    name: string;
    email: string;
  } | null;
};

export type ProjectDocument = {
  id: number;
  projectId: number;
  code: string;
  title: string;
  type: DocumentType;
  discipline?: string | null;
  originator?: string | null;
  zone?: string | null;
  level?: string | null;
  status: DocumentStatus;
  currentRevision?: string | null;
  description?: string | null;
  versions?: DocumentVersion[];
};

export type CreateDocumentPayload = {
  projectId: number;
  code: string;
  title: string;
  type: DocumentType;
  discipline?: string;
  originator?: string;
  zone?: string;
  level?: string;
  status?: DocumentStatus;
  currentRevision?: string;
  description?: string;
};

export const documentsApi = {
  findByProject: async (projectId: number): Promise<ProjectDocument[]> => {
    const response = await api.get(`/documents/project/${projectId}`);
    return response.data;
  },

  create: async (data: CreateDocumentPayload): Promise<ProjectDocument> => {
    const response = await api.post('/documents', data);
    return response.data;
  },

  update: async (
    id: number,
    data: Partial<CreateDocumentPayload>,
  ): Promise<ProjectDocument> => {
    const response = await api.patch(`/documents/${id}`, data);
    return response.data;
  },

  changeStatus: async (
    id: number,
    status: DocumentStatus,
  ): Promise<ProjectDocument> => {
    const response = await api.patch(`/documents/${id}/status/${status}`);
    return response.data;
  },

  uploadVersion: async (
    documentId: number,
    data: {
      file: File;
      revision: string;
      status: DocumentStatus;
      notes?: string;
    },
  ): Promise<DocumentVersion> => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('revision', data.revision);
    formData.append('status', data.status);

    if (data.notes) {
      formData.append('notes', data.notes);
    }

    const response = await api.post(
      `/documents/${documentId}/upload-version`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return response.data;
  },

  getDownloadUrl: (versionId: number) => {
    return `${import.meta.env.VITE_API_URL}/documents/versions/${versionId}/download`;
  },
};