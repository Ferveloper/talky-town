import { SessionSummaryScreen } from "@/components/conversation/conversation-screen";
export default function Page({ params }: { params: { profileId: string; sessionId: string } }) {
  return <SessionSummaryScreen {...params} />;
}
