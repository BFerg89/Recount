export type UserProfile = {
  id: string;
  username: string;
  nickname: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateProfileInput = {
  username: string;
  nickname: string;
};
