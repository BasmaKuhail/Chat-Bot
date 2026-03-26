import "@/styles/globals.css";

import type { AppProps } from "next/app";
import { Tajawal } from 'next/font/google';

const tajawal = Tajawal({ subsets: ['arabic'], weight: ['400','500','700'] });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${tajawal.className}`}>
        <Component {...pageProps} />
    </div>
  )
  
}