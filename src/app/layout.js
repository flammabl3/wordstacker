import "./globals.css";


import { PT_Serif } from "next/font/google";
const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["latin"],
  weight: ["400", "700"]
});


export const metadata = {
  title: "Word Stacker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={"bg-charcoal-900 " + `${ptSerif.variable} antialiased font-serif`}
      >
        {children}
      </body>
    </html>
  );
}
