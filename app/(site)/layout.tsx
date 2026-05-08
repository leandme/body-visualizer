import "../styles/globals.css";
import Script from "next/script";
import AmplitudeInitializer from "../components/AmplitudeInitializer";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-base-100 text-base-content">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-VQZ4ZPZFJF"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-VQZ4ZPZFJF');
          `}
        </Script>
        <AmplitudeInitializer />
        <Navbar />
        <main className="container mx-auto px-4 lg:px-8 pb-8 pt-0 min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
