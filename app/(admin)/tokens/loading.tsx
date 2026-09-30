import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { TokensSectionSkeleton } from "./tokens-section";

export default function Loading() {
  return (
    <>
      <PageBreadcrumb pageTitle="Tokens da API" />
      <TokensSectionSkeleton />
    </>
  );
}
