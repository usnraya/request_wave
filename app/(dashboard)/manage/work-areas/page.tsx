import { getCategories } from "@/lib/data";
import CategoriesManager from "@/components/manage/categories-manager";

export default async function ManageWorkAreasPage() {
  const categories = await getCategories();
  return <CategoriesManager categories={categories} />;
}

export const metadata = { title: "Work Areas | Request Wave" };
