import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Tags,
    Layers,
    ChevronRight,
    MoreVertical,
    MoreHorizontal
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export default function Categories() {
    const { toast } = useToast();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        parent: "none",
    });

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/categories`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(response.data.data);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load categories", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const payload = {
                ...formData,
                parent: formData.parent === "none" ? null : formData.parent
            };

            if (editingCategory) {
                await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/categories/${editingCategory._id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast({ title: "Success", description: "Category updated successfully" });
            } else {
                await axios.post(`${import.meta.env.VITE_API_BASE_URL}/categories`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast({ title: "Success", description: "Category created successfully" });
            }

            setIsModalOpen(false);
            resetForm();
            fetchCategories();
        } catch (error) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Operation failed",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will also unassign any subcategories.")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/categories/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast({ title: "Deleted", description: "Category removed successfully" });
            fetchCategories();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
        }
    };

    const resetForm = () => {
        setFormData({ name: "", description: "", parent: "none" });
        setEditingCategory(null);
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || "",
            parent: category.parent?._id || "none"
        });
        setIsModalOpen(true);
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const parentCategories = categories.filter(cat => !cat.parent);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-500">

            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input
                        placeholder="Search categories..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-stone-900 hover:bg-stone-800 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                </Button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-stone-50 border-stone-200">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-stone-500 font-medium">Total Categories</p>
                            <h3 className="text-2xl font-bold text-stone-900">{categories.length}</h3>
                        </div>
                        <div className="p-3 bg-stone-200 rounded-xl text-stone-700">
                            <Tags className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-stone-50 border-stone-200">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-stone-500 font-medium">Main Categories</p>
                            <h3 className="text-2xl font-bold text-stone-900">{parentCategories.length}</h3>
                        </div>
                        <div className="p-3 bg-stone-200 rounded-xl text-stone-700">
                            <Layers className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-stone-50 border-stone-200">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-stone-500 font-medium">Sub Categories</p>
                            <h3 className="text-2xl font-bold text-stone-900">{categories.length - parentCategories.length}</h3>
                        </div>
                        <div className="p-3 bg-stone-200 rounded-xl text-stone-700">
                            <ChevronRight className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Categories Table */}
            <Card className="border-stone-200">
                <Table>
                    <TableHeader className="bg-stone-50">
                        <TableRow>
                            <TableHead className="font-bold text-stone-900">Name</TableHead>
                            <TableHead className="font-bold text-stone-900">Type</TableHead>
                            <TableHead className="font-bold text-stone-900">Parent</TableHead>
                            <TableHead className="font-bold text-stone-900">Description</TableHead>
                            <TableHead className="text-right font-bold text-stone-900">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-100" />
                                        <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-200" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredCategories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-stone-500">
                                    No categories found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCategories.map((category) => (
                                <TableRow key={category._id} className="hover:bg-stone-50 transition-colors">
                                    <TableCell className="font-medium text-stone-900">
                                        <div className="flex items-center">
                                            {category.parent ? <ChevronRight className="w-3 h-3 mr-2 text-stone-400" /> : <Layers className="w-3 h-3 mr-2 text-stone-800" />}
                                            {category.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                            category.parent ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-stone-900 text-stone-50"
                                        )}>
                                            {category.parent ? "Sub" : "Main"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-stone-500 italic">
                                        {category.parent?.name || "—"}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate text-stone-600">
                                        {category.description || "No description"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuItem onClick={() => openEditModal(category)} className="cursor-pointer">
                                                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(category._id)} className="text-red-600 focus:text-red-600 cursor-pointer">
                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Add/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
                        <DialogDescription className="sr-only">
                            Form to create or update inventory categories.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Category Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Summer T-Shirts"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="parent">Parent Category (Optional)</Label>
                            <Select
                                value={formData.parent}
                                onValueChange={(val) => setFormData({ ...formData, parent: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a parent category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None (Main Category)</SelectItem>
                                    {parentCategories.map(cat => (
                                        <SelectItem key={cat._id} value={cat._id} disabled={cat._id === editingCategory?._id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Brief description of the category..."
                                className="resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-stone-900 text-white hover:bg-stone-800">
                                {editingCategory ? "Update Category" : "Save Category"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}
