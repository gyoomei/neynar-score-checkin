export type NeynarScoreData = {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  score: number;
  scoreLabel: string;
  followerCount: number;
  followingCount: number;
  verifiedAddresses: string[];
  activeStatus: string;
};

export type CheckInStatus = {
  canCheckIn: boolean;
  lastCheckIn: string | null;
  totalCheckIns: number;
  streak: number;
};

export type CheckInResult = {
  success: boolean;
  txHash?: string;
  message: string;
  newStreak?: number;
};

export type Tab = "score" | "checkin";
