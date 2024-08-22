import { Inter } from "next/font/google";
import "./globals.css";
import  "bootstrap/dist/css/bootstrap.min.css"

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Crypto Wallet",
  description: "Manage your cryptocurrency assets safely",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
