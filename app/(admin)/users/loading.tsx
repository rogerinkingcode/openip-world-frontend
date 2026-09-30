import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { UsersSkeleton } from "./users-view";

export default function Loading() {
  return (
    <>
      <PageBreadcrumb pageTitle="Usuários" />
      <UsersSkeleton />
    </>
  );
}
