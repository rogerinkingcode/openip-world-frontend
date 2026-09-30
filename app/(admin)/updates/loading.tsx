import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { UpdatesSkeleton } from "./updates-view";

export default function Loading() {
  return (
    <>
      <PageBreadcrumb pageTitle="Controle de atualizações" />
      <UpdatesSkeleton />
    </>
  );
}
