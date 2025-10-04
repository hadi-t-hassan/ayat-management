import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Users, Edit, Trash2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/utils/api';

// Available pages for permissions
const AVAILABLE_PAGES = [
  { id: 'dashboard', title: 'Dashboard', description: 'Overview and statistics' },
  { id: 'users', title: 'Users Settings', description: 'Manage users and permissions' },
  { id: 'events', title: 'Manage Events', description: 'Create and manage events' },
  { id: 'parties', title: 'View Parties', description: 'View event participants' },
  { id: 'language-settings', title: 'Language Settings', description: 'Customize translation values' },
];

// Type
interface Profile {
  id: string;
  name: string;
  username: string;
  role: string;
  user_id: string;
  permissions?: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export default function UsersSettings() {
  const { profile: currentProfile } = useAuth();
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(true);

  const [userForm, setUserForm] = useState({
    name: '',
    username: '',
    role: 'user',
    password: '',
  });

  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const [editingUser, setEditingUser] = useState<Profile | null>(null);

  const isAdmin = currentProfile?.role === 'admin';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiGet('/users/');
      
      if (response.error) {
        throw new Error(response.error);
      }

      setUsers(response.data?.results || response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can add new users",
        variant: "destructive",
      });
      return;
    }

    if (!userForm.name || !userForm.username || !userForm.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Split name into first and last name
      const nameParts = userForm.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const response = await apiPost('/users/create/', {
        username: userForm.username,
        first_name: firstName,
        last_name: lastName,
        password: userForm.password,
        role: userForm.role,
        permissions: userPermissions,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const newUser = response.data;
      
      // Add to local state
      setUsers(prev => [newUser, ...prev]);

      toast({
        title: "Success!",
        description: `User ${userForm.name} has been created successfully`,
      });

      // Reset form
      setUserForm({
        name: '',
        username: '',
        role: 'user',
        password: '',
      });
      setUserPermissions({});

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'user':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleEditUser = (user: Profile) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      username: user.username,
      role: user.role,
      password: '', // Don't pre-fill password for security
    });
    setUserPermissions(user.permissions || {});
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can delete users",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiDelete(`/users/${userId}/`);

      if (response.error) {
        throw new Error(response.error);
      }

      // Remove from local state
      setUsers(prev => prev.filter(user => user.id !== userId));

      toast({
        title: "Success!",
        description: "User has been deleted successfully",
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can update users",
        variant: "destructive",
      });
      return;
    }

    if (!editingUser) {
      toast({
        title: "Error",
        description: "No user selected for editing",
        variant: "destructive",
      });
      return;
    }

    if (!userForm.name || !userForm.username) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Split name into first and last name
      const nameParts = userForm.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const updateData: any = {
        first_name: firstName,
        last_name: lastName,
        role: userForm.role,
        permissions: userPermissions,
      };

      // Only include password if it's provided
      if (userForm.password) {
        updateData.password = userForm.password;
      }

      const response = await apiPatch(`/users/${editingUser.id}/`, updateData);

      if (response.error) {
        throw new Error(response.error);
      }

      const updatedUser = response.data;
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === editingUser.id 
          ? { ...user, name: userForm.name, username: userForm.username, role: userForm.role, permissions: userPermissions }
          : user
      ));

      toast({
        title: "Success!",
        description: `User ${userForm.name} has been updated successfully`,
      });

      // Reset form and editing state
      setUserForm({
        name: '',
        username: '',
        role: 'user',
        password: '',
      });
      setUserPermissions({});
      setEditingUser(null);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      username: '',
      role: 'user',
      password: '',
    });
    setUserPermissions({});
  };

  const handlePermissionChange = (pageId: string, checked: boolean) => {
    setUserPermissions(prev => ({
      ...prev,
      [pageId]: checked
    }));
  };

  return (
    <div className={`space-y-4 md:space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className={`px-1 ${isRTL ? 'text-right' : 'text-left'}`}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t.userManagement}</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          {t.permissions}
        </p>
      </div>

      {/* Add User Form */}
      <Card>
        <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {editingUser ? 'Edit User' : 'Add New User'}
              </CardTitle>
              <CardDescription>
                {editingUser ? 'Update user information and permissions' : 'Create a new user account with specific page permissions'}
                {!isAdmin && " (Admin access required)"}
              </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={editingUser ? handleUpdateUser : handleSubmit} className="space-y-6">
            {/* Basic User Information */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter full name"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  disabled={!isAdmin}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  disabled={!isAdmin}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={editingUser ? "Enter new password (leave blank to keep current)" : "Enter password"}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  disabled={!isAdmin}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={userForm.role} 
                  onValueChange={(value) => setUserForm({ ...userForm, role: value })}
                  disabled={!isAdmin}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Page Permissions */}
            {isAdmin && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  <Label className="text-base font-medium">Page Permissions</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Select which pages this user can access when they log in.
                </p>
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                  {AVAILABLE_PAGES.map((page) => (
                    <div key={page.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`permission-${page.id}`}
                        checked={userPermissions[page.id] || false}
                        onCheckedChange={(checked) => handlePermissionChange(page.id, checked as boolean)}
                        disabled={!isAdmin}
                      />
                      <div className="flex-1">
                        <Label 
                          htmlFor={`permission-${page.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {page.title}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {page.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading || !isAdmin}
                className="w-full md:w-auto"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingUser ? 'Update User' : 'Add User'}
              </Button>
              {editingUser && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={loading}
                  className="w-full md:w-auto"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            System Users
          </CardTitle>
          <CardDescription>
            All registered users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fetchingUsers ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Name</TableHead>
                    <TableHead className="min-w-[100px]">Username</TableHead>
                    <TableHead className="min-w-[80px]">Role</TableHead>
                    <TableHead className="min-w-[200px]">Permissions</TableHead>
                    <TableHead className="min-w-[100px]">Created</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>@{user.username}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.permissions && Object.entries(user.permissions).map(([pageId, hasAccess]) => {
                              if (hasAccess) {
                                const page = AVAILABLE_PAGES.find(p => p.id === pageId);
                                return page ? (
                                  <Badge key={pageId} variant="outline" className="text-xs">
                                    {page.title}
                                  </Badge>
                                ) : null;
                              }
                              return null;
                            })}
                            {(!user.permissions || Object.values(user.permissions).every(p => !p)) && (
                              <span className="text-xs text-muted-foreground">No permissions</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!isAdmin}
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!isAdmin || user.id === currentProfile?.id}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
