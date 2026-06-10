export type Friendship = {
  id: string;
  status: 'pending' | 'accepted';
  direction: 'incoming' | 'outgoing';
  otherProfile: {
    id: string;
    username: string;
    nickname: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type FriendProfile = {
  id: string;
  username: string;
  nickname: string;
};
