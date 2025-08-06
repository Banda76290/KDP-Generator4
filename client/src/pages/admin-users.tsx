import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Search, UserCheck, UserX, Shield, Crown, User } from "lucide-react";
import { format } from "date-fns";
import Layout from "@/components/Layout";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "user" | "admin" | "superadmin";
  subscriptionTier: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function AdminUsers() {
  const { isAdmin, isSuperAdmin, isLoading } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const limit = 50;

  // Redirect to home if not admin
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions d'administrateur.",
        variant: "destructive",)};
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAdmin, isLoading, toast]);

  const { data: usersData, isLoading: usersLoading } = useQuery<{users: User[], total: number}>({
    queryKey: ["/api/admin/users", { search: searchTerm, limit, offset: currentPage * limit }],
    enabled: isAdmin,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role)}: { userId: string; role: string } => {
      return await apiRequest(`/api/admin/users/${userId)}/role`, { method: "PUT", body: JSON.stringify({ role)} });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"])};
      toast({
        title: "Succès",
        description: "Rôle utilisateur mis à jour avec succès.",
      };
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le rôle.",
        variant: "destructive",)};
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/admin/users/${userId)}/deactivate`, { method: "PUT" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"])};
      toast({
        title: "Succès",
        description: "Utilisateur désactivé avec succès.",
      };
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de désactiver l'utilisateur.",
        variant: "destructive",)};
    },
  });

  const reactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/admin/users/${userId)}/reactivate`, { method: "PUT" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"])};
      toast({
        title: "Succès",
        description: "Utilisateur réactivé avec succès.",
      };
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de réactiver l'utilisateur.",
        variant: "destructive",)};
    },
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "superadmin":
        return <Crown className="h-4 w-4" />;
      case "admin":
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "superadmin":
        return "default";
      case "admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading || usersLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <Layout>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={ () => window.history.back( )}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">
            Administration des comptes utilisateurs
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs de la Plateforme</CardTitle>
          <CardDescription>
            Total: {usersData?.total || 0} utilisateurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par email, prénom ou nom..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                className="pl-9"
              />
            </div>

            {/* Users Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Abonnement</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Inscription</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.users?.map((user: User) => (
                    <TableRow key={user.id)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          { getRoleIcon(user.role)}
                          <span className="font-medium">
                            {user.firstName || user.lastName
                              ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                              : "Utilisateur"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={ getRoleBadgeVariant(user.role)}>
                          {user.role === "superadmin" ? "Super Admin" : 
                           user.role === "admin" ? "Admin" : "Utilisateur"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.subscriptionTier === "free" ? "outline" : "default"}>
                          {user.subscriptionTier === "free" ? "Gratuit" : "Premium"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "destructive"}>
                          {user.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        { format(new Date(user.createdAt), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select onValueChange={(role) => {
                            if (role !== user.role) {
                              setSelectedUser(user);
                              updateRoleMutation.mutate({ userId: user.id, role)};
                            }
                          }}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Rôle" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Utilisateur</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              { isSuperAdmin && (
                                <SelectItem value="superadmin">Super Admin</SelectItem>)}
                            </SelectContent>
                          </Select>
                          
                          { user.isActive ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <UserX className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Désactiver l'utilisateur</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir désactiver cet utilisateur ? 
                                    Il ne pourra plus se connecter à la plateforme.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deactivateUserMutation.mutate(user.id ))}>
                                    Désactiver
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={ () => reactivateUserMutation.mutate(user.id )}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage + 1} sur { Math.ceil((usersData?.total || 0) / limit)}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 0}
                  onClick={ () => setCurrentPage(currentPage - 1 )}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= Math.ceil((usersData?.total || 0) / limit) - 1}
                  onClick={ () => setCurrentPage(currentPage + 1 )}
                >
                  Suivant
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}