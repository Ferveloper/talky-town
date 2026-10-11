import { ChildHomeScreen } from "@/components/profiles/screens";
export default function Page({ params }: { params: { profileId: string } }) {
  return <ChildHomeScreen profileId={params.profileId} />;
}
