import { RewardsScreen } from "@/components/gamification/rewards-screen";
export default function Page({ params }: { params: { profileId: string } }) {
  return <RewardsScreen {...params} />;
}
