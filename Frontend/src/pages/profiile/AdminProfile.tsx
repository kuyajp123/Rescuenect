import PageBreadcrumb from "@/components/ui/userProfile/PageBreadCrumb";
import UserMetaCard from "@/components/ui/userProfile/UserMetaCard";
import UserInfoCard from "@/components/ui/userProfile/UserInforCard";
import { Card, CardBody} from "@heroui/react";
import UserAddressCard from "@/components/ui/userProfile/UserAddressCard";
// import PageMeta from "../components/common/PageMeta";

export default function UserProfiles() {
  return (
    // <div className="container mx-auto px-4 py-8">
    <div>
      {/* <PageMeta
        title="React.js Profile Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Profile Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      /> */}
      <PageBreadcrumb pageTitle="Profile" />
      <Card>
        <CardBody>
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
          <UserMetaCard />
          <UserInfoCard />
          <UserAddressCard />
        </div>
        </CardBody>
      </Card>
    </div>
  );
}
