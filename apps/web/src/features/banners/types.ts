export interface Banner {
  id: string;
  academyId: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface BannerMetaInput {
  title: string;
  linkUrl?: string;
  order?: number;
  active?: boolean;
}
