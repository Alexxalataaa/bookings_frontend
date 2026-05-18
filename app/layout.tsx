import "./globals.css";
import type { Metadata } from "next";
import { LoadingProvider } from "@/components/ui/LoadingProvider";

export const metadata: Metadata = {
  title: "Bookings Admin",
  description: "Base inicial del proyecto de gestión de reservas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('app-theme');
                  var brightness = localStorage.getItem('app-brightness');
                  if (theme) {
                    document.documentElement.setAttribute('data-theme', theme);
                  }
                  if (brightness) {
                    document.documentElement.setAttribute('data-brightness', brightness);
                  } else {
                    document.documentElement.setAttribute('data-brightness', 'dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <LoadingProvider>
          {children}
        </LoadingProvider>
      </body>
    </html>
  );
}