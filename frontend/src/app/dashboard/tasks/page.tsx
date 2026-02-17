import { getCategories } from './actions'
import { TasksDashboard } from '@/components/tasks/tasks-dashboard'

export default async function TasksPage() {
    const categories = await getCategories()

    return <TasksDashboard categories={categories} />
}
