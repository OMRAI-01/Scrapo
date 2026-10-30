import type { Metadata } from "next";
import { HomePage } from "@/components/marketing/home-page";

export const metadata: Metadata = {
  title: "Give electronics a second life",
};

export default function Page() {
  return <HomePage />;
}
