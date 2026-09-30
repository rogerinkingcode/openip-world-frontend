import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ApiDocsView from "./api-docs-view";

export const metadata: Metadata = {
  title: "Endpoints da API",
};

export default function ApiDocsPage() {
  return (
    <>
      <PageBreadcrumb pageTitle="Endpoints da API" />
      <ApiDocsView />
    </>
  );
}
