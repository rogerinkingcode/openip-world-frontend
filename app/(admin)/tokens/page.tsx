import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import TokensSection from "./tokens-section";

export const metadata: Metadata = {
  title: "Tokens da API",
};

export default function TokensPage() {
  return (
    <>
      <PageBreadcrumb pageTitle="Tokens da API" />
      <TokensSection />
    </>
  );
}
