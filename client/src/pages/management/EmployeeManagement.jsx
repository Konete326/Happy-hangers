import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    UserPlus,
    ShieldCheck,
    Eye,
    ChevronRight,
    ChevronLeft,
    Plus,
    Trash2,
    Mail,
    Lock,
    User,
    Package,
    ShoppingCart,
    FileText,
    BarChart3,
    UserCircle,
    CheckCircle2,
    Briefcase,
    Shield,
    X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import API from "@/api/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";

const PERMISSIONS = [
    { id: "inventory", label: "Inventory", icon: Package, description: "Manage products, categories and stock." },
    { id: "pos", label: "POS", icon: ShoppingCart, description: "Access selling interface and barcode scanning." },
    { id: "orders", label: "Orders", icon: FileText, description: "View transaction history and print receipts." },
    { id: "customers", label: "Customers", icon: UserCircle, description: "View and manage customer data." },
    { id: "reports", label: "Reports", icon: BarChart3, description: "View sales analytics and business growth." },
    { id: "employees", label: "Employees", icon: Shield, description: "Manage other staff and permissions." },
];

export default function EmployeeManagement() {
    const { toast } = useToast();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [wizardStep, setWizardStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        permissions: [],
        dataVisibility: "all"
    });

    const fetchEmployees = async () => {
        try {
            const response = await API.get("/employees");
            setEmployees(response.data.data);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load employees", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const resetWizard = () => {
        setWizardStep(1);
        setFormData({
            name: "",
            email: "",
            password: "",
            permissions: [],
            dataVisibility: "all"
        });
        setIsWizardOpen(false);
    };

    const togglePermission = (id) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(id)
                ? prev.permissions.filter(p => p !== id)
                : [...prev.permissions, id]
        }));
    };

    const handleAddEmployee = async () => {
        if (!formData.name || !formData.email || !formData.password) {
            toast({ title: "Missing Info", description: "Please fill all basic details", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            await API.post("/employees", formData);
            toast({ title: "Success", description: "Employee added successfully" });
            fetchEmployees();
            resetWizard();
        } catch (error) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to add employee",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRequest = (employee) => {
        setEmployeeToDelete(employee);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!employeeToDelete) return;
        try {
            await API.delete(`/employees/${employeeToDelete._id}`);
            setEmployees(prev => prev.filter(emp => emp._id !== employeeToDelete._id));
            toast({ title: "Access Revoked", description: `${employeeToDelete.name}'s account has been deleted.` });
        } catch (error) {
            toast({ title: "Error", description: "Failed to remove employee", variant: "destructive" });
        } finally {
            setIsDeleteDialogOpen(false);
            setEmployeeToDelete(null);
        }
    };

    const nextStep = () => {
        if (wizardStep === 1) {
            if (!formData.name || !formData.email || !formData.password) {
                toast({ title: "Required Fields", description: "Please fill Name, Email and Password first.", variant: "destructive" });
                return;
            }
            if (formData.password.length < 6) {
                toast({ title: "Weak Password", description: "Password must be at least 6 characters.", variant: "destructive" });
                return;
            }
        }
        setWizardStep(prev => Math.min(prev + 1, 3));
    };
    const prevStep = () => setWizardStep(prev => Math.max(prev - 1, 1));

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-700 max-w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-stone-900 flex items-center gap-3">
                        <Users className="w-10 h-10 text-stone-900" />
                        Team & Access
                    </h1>
                    <p className="text-stone-500 mt-2 font-medium">Manage staff accounts and functional permissions.</p>
                </div>
                <Button
                    onClick={() => setIsWizardOpen(true)}
                    className="bg-stone-900 hover:bg-stone-800 text-white h-12 px-6 rounded-xl font-bold shadow-xl shadow-stone-200"
                >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Add New Employee
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-stone-100 shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase text-[10px] font-bold tracking-widest text-stone-400">Total Staff</CardDescription>
                        <CardTitle className="text-3xl font-black">{employees.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-stone-100 shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase text-[10px] font-bold tracking-widest text-stone-400">Active Licenses</CardDescription>
                        <CardTitle className="text-3xl font-black text-emerald-600">{employees.length + 1}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-stone-100 shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase text-[10px] font-bold tracking-widest text-stone-400">Security Mode</CardDescription>
                        <CardTitle className="text-3xl font-black text-stone-900 uppercase tracking-tighter">Enhanced</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="border-stone-100 shadow-xl overflow-hidden bg-white">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-stone-50 border-b border-stone-200">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-bold text-stone-900 h-14">Employee</TableHead>
                                <TableHead className="font-bold text-stone-900 h-14">Role</TableHead>
                                <TableHead className="font-bold text-stone-900 h-14">Permissions</TableHead>
                                <TableHead className="font-bold text-stone-900 h-14 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-40 text-center">
                                        <div className="inline-block w-8 h-8 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin"></div>
                                    </TableCell>
                                </TableRow>
                            ) : employees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-40 text-center text-stone-400 font-medium">
                                        No employees added yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                employees.map((emp) => (
                                    <TableRow key={emp._id} className="hover:bg-stone-50/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-600 border border-stone-200">
                                                    {emp.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-stone-900">{emp.name}</p>
                                                    <p className="text-xs text-stone-500 font-medium">{emp.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-stone-50 border-stone-200 font-bold uppercase text-[10px] tracking-widest text-stone-600">
                                                {emp.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {emp.permissions.map(p => (
                                                    <span key={p} className="text-[10px] px-2 py-0.5 bg-stone-100 text-stone-600 rounded font-bold uppercase tracking-tight capitalize">{p}</span>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-stone-300 hover:text-red-600"
                                                onClick={() => handleDeleteRequest(emp)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
                <DialogContent hideClose className="sm:max-w-[600px] p-0 overflow-hidden rounded-2xl border-none">
                    <div className="bg-stone-900 p-8 text-white relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={resetWizard}
                            className="absolute right-4 top-4 text-white/30 hover:text-white hover:bg-white/10 rounded-full z-50"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Users className="w-32 h-32" />
                        </div>
                        <p className="text-stone-400 text-xs font-bold uppercase tracking-[0.2em] mb-2 leading-none">Step {wizardStep} of 3</p>
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black tracking-tight leading-tight">
                                {wizardStep === 1 && "Employee Credentials"}
                                {wizardStep === 2 && "Configure Access"}
                                {wizardStep === 3 && "Data Visibility"}
                            </DialogTitle>
                            <DialogDescription className="text-stone-400">
                                {wizardStep === 1 && "Provide basic information for the new staff member."}
                                {wizardStep === 2 && "Choose which parts of the system are accessible."}
                                {wizardStep === 3 && "Control if the employee can see firm-wide sales data."}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-8 bg-white min-h-[400px] flex flex-col justify-between">
                        <AnimatePresence mode="wait">
                            {wizardStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-5"
                                >
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-stone-500">Full Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                            <Input
                                                placeholder="e.g. Ali Ahmed"
                                                className="pl-10 h-12 text-base rounded-xl border-stone-200 bg-stone-50 focus:bg-white"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-stone-500">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                            <Input
                                                type="email"
                                                placeholder="employee@store.com"
                                                className="pl-10 h-12 text-base rounded-xl border-stone-200 bg-stone-50 focus:bg-white"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-stone-500">Secure Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                            <Input
                                                type="password"
                                                placeholder="Minimal 6 characters"
                                                className="pl-10 h-12 text-base rounded-xl border-stone-200 bg-stone-50 focus:bg-white"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {wizardStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="grid grid-cols-2 gap-3"
                                >
                                    {PERMISSIONS.map((perm) => (
                                        <div
                                            key={perm.id}
                                            onClick={() => togglePermission(perm.id)}
                                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${formData.permissions.includes(perm.id)
                                                ? "border-stone-900 bg-stone-50"
                                                : "border-stone-100 hover:border-stone-200"
                                                }`}
                                        >
                                            <div className={`p-2 rounded-lg ${formData.permissions.includes(perm.id) ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-400"}`}>
                                                <perm.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-stone-900 text-sm">{perm.label}</p>
                                                <p className="text-[10px] text-stone-500 leading-tight mt-1">{perm.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                            {wizardStep === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div
                                        className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${formData.dataVisibility === 'all' ? 'border-stone-900 bg-stone-50 shadow-lg shadow-stone-100' : 'border-stone-100 hover:border-stone-200'}`}
                                        onClick={() => setFormData({ ...formData, dataVisibility: 'all' })}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${formData.dataVisibility === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'}`}>
                                                <Eye className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-stone-900">Total Insights</p>
                                                <p className="text-xs text-stone-500 font-medium">Allows viewing sales from all staff members.</p>
                                            </div>
                                        </div>
                                        {formData.dataVisibility === 'all' && <CheckCircle2 className="w-6 h-6 text-stone-900" />}
                                    </div>

                                    <div
                                        className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${formData.dataVisibility === 'own' ? 'border-stone-900 bg-stone-50 shadow-lg shadow-stone-100' : 'border-stone-100 hover:border-stone-200'}`}
                                        onClick={() => setFormData({ ...formData, dataVisibility: 'own' })}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${formData.dataVisibility === 'own' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'}`}>
                                                <Briefcase className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-stone-900">Private Records</p>
                                                <p className="text-xs text-stone-500 font-medium">Employee only sees their own transactions.</p>
                                            </div>
                                        </div>
                                        {formData.dataVisibility === 'own' && <CheckCircle2 className="w-6 h-6 text-stone-900" />}
                                    </div>

                                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-3 text-amber-800">
                                        <ShieldCheck className="w-5 h-5 shrink-0" />
                                        <p className="text-xs font-medium leading-relaxed">
                                            Administrators always have full visibility. These settings only apply when the employee logs in with their credentials.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex items-center justify-between mt-12 pt-6 border-t border-stone-100">
                            <Button
                                variant="ghost"
                                onClick={prevStep}
                                disabled={wizardStep === 1}
                                className="font-bold text-stone-400 disabled:opacity-30"
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Previous
                            </Button>

                            {wizardStep < 3 ? (
                                <Button
                                    onClick={nextStep}
                                    className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold h-11 px-8"
                                >
                                    Continue
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button
                                    disabled={isSubmitting}
                                    onClick={handleAddEmployee}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold h-11 px-8 min-w-[120px]"
                                >
                                    {isSubmitting ? "Creating..." : "Finalize & Create"}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-stone-900 tracking-tight">Delete Account?</AlertDialogTitle>
                        <AlertDialogDescription className="text-stone-500 font-medium leading-relaxed mt-2">
                            You are about to permanently remove access for <span className="text-stone-900 font-bold">{employeeToDelete?.name}</span>.
                            This action will immediately disable their login and cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 gap-3">
                        <AlertDialogCancel className="rounded-xl border-stone-200 font-bold text-stone-400 h-12 uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold h-12 px-8 uppercase tracking-widest text-[10px] shadow-lg shadow-red-100"
                        >
                            Remove Access
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
