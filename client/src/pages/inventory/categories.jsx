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
    DialogDescription,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
    MoreHorizontal,
    Upload,
    X,
    ImageIcon,
    Loader2
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import API from "@/api/api";

export default function Categories() {
    const { toast } = useToast();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReadingImage, setIsReadingImage] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        parent: "none",
        image: ""
    });

    const fetchCategories = async () => {
        try {
            const response = await API.get("/categories");
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
        if (isSubmitting || isReadingImage) return;
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                parent: formData.parent === "none" ? null : formData.parent,
            };
            if (editingCategory) {
                await API.patch(`/categories/${editingCategory._id}`, payload);
                toast({ title: "Updated", description: "Category updated successfully." });
            } else {
                await API.post("/categories", payload);
                toast({ title: "Created", description: "Category created successfully." });
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
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!categoryToDelete) return;
        try {
            await API.delete(`/categories/${categoryToDelete._id}`);
            toast({ title: "Deleted", description: "Category removed successfully." });
            fetchCategories();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
        } finally {
            setIsDeleteDialogOpen(false);
            setCategoryToDelete(null);
        }
    };

    const resetForm = () => {
        setFormData({ name: "", description: "", parent: "none", image: "" });
        setEditingCategory(null);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            toast({ title: "File Too Large", description: "Category image must be under 2MB.", variant: "destructive" });
            return;
        }
        setIsReadingImage(true);
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, image: reader.result }));
            setIsReadingImage(false);
        };
        reader.onerror = () => {
            toast({ title: "Upload Failed", description: "Could not process image.", variant: "destructive" });
            setIsReadingImage(false);
        };
        reader.readAsDataURL(file);
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || "",
            parent: category.parent?._id || "none",
            image: category.image || ""
        });
        setIsModalOpen(true);
    };

    const openDeleteDialog = (id) => {
        setCategoryToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const filteredCategories = categories.filter(cat => {
        const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cat.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === "all" ? true :
            filterType === "main" ? !cat.parent :
                !!cat.parent;

        return matchesSearch && matchesType;
    });

    const parentCategories = categories.filter(cat => !cat.parent);

    return (
        <div className="h-full overflow-y-auto p-6 space-y-6 animate-in fade-in duration-500">

            <div className="grid grid-cols-12 gap-4 items-center mb-6">
                <div className="col-span-12 md:col-span-8 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input
                        placeholder="Search categories..."
                        className="pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="col-span-12 md:col-span-2">
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="main">Main Categories Only</SelectItem>
                            <SelectItem value="sub">Sub Categories Only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="col-span-12 md:col-span-2">
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="w-full bg-stone-900 hover:bg-stone-800 text-white shrink-0">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Category
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                    className={cn(
                        "bg-stone-50 border-stone-200 cursor-pointer hover:border-stone-400 hover:shadow-sm transition-all duration-200",
                        filterType === "all" && "border-stone-600 bg-stone-100/50"
                    )}
                    onClick={() => setFilterType("all")}
                >
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
                <Card
                    className={cn(
                        "bg-stone-50 border-stone-200 cursor-pointer hover:border-stone-400 hover:shadow-sm transition-all duration-200",
                        filterType === "main" && "border-stone-600 bg-stone-100/50"
                    )}
                    onClick={() => setFilterType("main")}
                >
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
                <Card
                    className={cn(
                        "bg-stone-50 border-stone-200 cursor-pointer hover:border-stone-400 hover:shadow-sm transition-all duration-200",
                        filterType === "sub" && "border-stone-600 bg-stone-100/50"
                    )}
                    onClick={() => setFilterType("sub")}
                >
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

            <Card className="border-stone-200">
                <Table>
                    <TableHeader className="bg-stone-50">
                        <TableRow>
                            <TableHead className="w-12 font-bold text-stone-900">Image</TableHead>
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
                                    <TableCell className="w-12">
                                        {category.image ? (
                                            <div className="w-9 h-9 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 shrink-0">
                                                <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-9 h-9 rounded-lg border border-stone-200 bg-stone-100 shrink-0 flex items-center justify-center text-stone-300">
                                                <ImageIcon className="w-4 h-4" />
                                            </div>
                                        )}
                                    </TableCell>
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
                                                <DropdownMenuItem onClick={() => openDeleteDialog(category._id)} className="text-red-600 focus:text-red-600 cursor-pointer">
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

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-stone-700">Category Cover Image (Optional)</Label>
                            {isReadingImage ? (
                                <div className="flex flex-col items-center justify-center w-full h-24 border-2 border-stone-200 rounded-lg bg-stone-50">
                                    <Loader2 className="w-6 h-6 text-stone-600 animate-spin mb-1" />
                                    <span className="text-xs font-bold text-stone-600">Processing image...</span>
                                </div>
                            ) : formData.image ? (
                                <div className="relative w-full h-28 bg-stone-100 rounded-lg overflow-hidden border border-stone-200 group flex items-center justify-center">
                                    <img src={formData.image} alt="Category preview" className="w-full h-full object-cover" />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        disabled={isSubmitting}
                                        className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-90 shadow"
                                        onClick={() => setFormData(prev => ({ ...prev, image: "" }))}
                                        title="Remove image"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-stone-200 rounded-lg cursor-pointer bg-stone-50/50 hover:bg-stone-50 hover:border-stone-400 transition-all">
                                    <div className="flex flex-col items-center justify-center pt-2 pb-2 text-stone-500">
                                        <Upload className="w-5 h-5 mb-1 text-stone-400" />
                                        <p className="text-xs font-semibold">Click to upload category image</p>
                                        <p className="text-[10px] text-stone-400">PNG, JPG, WEBP (Max 2MB)</p>
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isSubmitting || isReadingImage} />
                                </label>
                            )}
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" disabled={isSubmitting || isReadingImage} onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || isReadingImage}
                                className="bg-stone-900 text-white hover:bg-stone-800 font-bold min-w-[130px]"
                            >
                                {isReadingImage ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {editingCategory ? "Updating..." : "Saving..."}
                                    </>
                                ) : (
                                    editingCategory ? "Update Category" : "Save Category"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the category
                            and unassign it from any relevant subcategories.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 text-white hover:bg-red-700">
                            Delete Category
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
