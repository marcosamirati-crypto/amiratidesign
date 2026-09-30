import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CursorLight from "@/components/CursorLight";
import Cursor from "@/components/Cursor";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <CursorLight />
      <Cursor />
    </>
  );
}
