export interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_name: string;
  user_position: string;
  user_team: string;
  attachments?: PostAttachment[];
  comments?: PostComment[];
}

export interface PostAttachment {
  id: string;
  post_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_position: string;
  user_team: string;
}

export interface CreatePostData {
  title: string;
  content: string;
  category: string;
  is_pinned?: boolean;
}

export interface CreateCommentData {
  content: string;
}
