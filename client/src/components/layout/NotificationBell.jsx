import { useState } from "react";
import { Bell, Package, Check, Trash2, X, AlertCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
// import API from "@/api/api";
import { useToast } from "@/hooks/use-toast";

export function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { toast } = useToast();

    /*
    const fetchNotifications = async () => {
        try {
            const res = await API.get("/notifications");
            setNotifications(res.data.data);
            setUnreadCount(res.data.data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error("Failed to fetch notifications");
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            await API.patch(`/notifications/${id}/read`);
            fetchNotifications();
        } catch (err) {
            toast({ title: "Error", description: "Failed to update notification", variant: "destructive" });
        }
    };

    const deleteNotification = async (e, id) => {
        e.stopPropagation();
        try {
            await API.delete(`/notifications/${id}`);
            fetchNotifications();
        } catch (err) {
            toast({ title: "Error", description: "Failed to delete notification", variant: "destructive" });
        }
    };

    const clearAll = async () => {
        try {
            await API.delete("/notifications/clear");
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            toast({ title: "Error", description: "Failed to clear notifications", variant: "destructive" });
        }
    };
    */

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-stone-600 hover:text-stone-900 border-none bg-transparent">
                    <Bell className="h-5 w-5" />
                    {/* {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 animate-pulse border-white">
                            {unreadCount}
                        </Badge>
                    )} */}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[350px]">
                <DialogHeader>
                    <DialogTitle>Coming Soon</DialogTitle>
                    <DialogDescription>
                        This feature is temporarily disabled and will be available soon.
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}
