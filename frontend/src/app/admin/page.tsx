export default function AdminPage() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
                    <span className="text-muted-foreground">Total Users Stats</span>
                </div>
                <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
                    <span className="text-muted-foreground">Active Subscriptions</span>
                </div>
                <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
                    <span className="text-muted-foreground">System Health</span>
                </div>
            </div>
            <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 flex items-center justify-center">
                <span className="text-muted-foreground">Admin Activity Log</span>
            </div>
        </div>
    )
}
