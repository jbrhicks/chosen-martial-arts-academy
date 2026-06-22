import PublicLayout from "@/components/PublicLayout";
import HeroSection from "@/components/home/HeroSection";
import MissionSection from "@/components/home/MissionSection";
import SchedulePreview from "@/components/home/SchedulePreview";
import TestimonialsPreview from "@/components/home/TestimonialsPreview";
import LeadSection from "@/components/home/LeadSection";

export default function Home() {
  return (
    <PublicLayout>
      <HeroSection />
      <MissionSection />
      <SchedulePreview />
      <TestimonialsPreview />
      <LeadSection />
    </PublicLayout>
  );
}