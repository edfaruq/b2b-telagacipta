import BuyerDashboardPage from "./(buyer)/dashboard/page";
import GlobalNavbar from "@/components/GlobalNavbar";
import SplashScreen from "@/components/SplashScreen";

export default function HomePage() {
  return (
    <>
      <SplashScreen />
      <GlobalNavbar />
      <BuyerDashboardPage />
    </>
  );
}
