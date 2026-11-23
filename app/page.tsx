import FaqSection from "./home/q&A";
import PromoBanner from "./home/WELCOME";
import HeroBanner from "./home/HeroBanner";
import HeroPage from "./home/heropage";
import BlogSection from "./home/BlogSection";
import ReviewsSection from "./home/reviwes";
import ServiceCards from "./home/serves";

export default function Home() {
  return (
    <div className="flex flex-col flex-1  justify-center bg-zinc-50 font-sans dark:bg-black">
    <HeroPage />
      <HeroBanner />
      <ServiceCards />
      <FaqSection />
      <PromoBanner />
      <ReviewsSection />
      <BlogSection />
    </div>
  );
}
