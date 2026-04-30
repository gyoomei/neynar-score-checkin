export type NeynarScoreSource = "neynar-api" | "onchain-base";

export interface NeynarScoreData {
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
  scoreSource: "neynar-api" | "onchain-base" | "custom-warpcast";
  breakdown?: {
    social: number;
    consistency: number;
    trust: number;
    onchain: number;
  };
}

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
