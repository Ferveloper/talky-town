import { AdultProfileScreen } from "@/components/parent/adult-screens";
export default function Page({ params }: { params: { profileId: string } }) {
  return <AdultProfileScreen {...params} />;
}
