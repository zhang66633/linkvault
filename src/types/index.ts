export interface IBookmark {
  id: string;
  url: string;
  title: string;
  description: string;
  coverImage: string;
  summary: string;
  categoryId: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ICategory {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}
