import { getShoppingList } from "@/app/actions/shopping"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ShoppingListView } from "@/components/shopping/shopping-list-view"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ShoppingListPage({ params }: PageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const { id } = await params
  const list = await getShoppingList(id)

  if (!list) {
    redirect("/dashboard")
  }

  return <ShoppingListView list={list} />
}
