'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useUsers } from '@/hooks/useUsers';
import { EditUserModal } from './EditUserModal';

interface ApiUser {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}


export function UserList() {
  const {
    users,
    isLoading,
    isError,
    error,
    fetchUsers,
    deleteUser,
    deleteUserStatus,
  } = useUsers();

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] =
      useState<ApiUser | null>(null);


  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-expect-error
  const userArray: ApiUser[] = Array.isArray(users?.data)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-expect-error
      ? users.data
      : [];

  // 2) sort descending by createdAt
  const sortedUsers = [...userArray].sort((a, b) => {
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return (
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
  });

  const handleEdit = (id: string) => setEditingUserId(id);

  const openDeleteModal = (u: ApiUser) => {
    setUserToDelete(u);
    setShowDeleteModal(true);
  };
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };
  const handleDelete = async () => {
    if (!userToDelete) return;
    await deleteUser(userToDelete.id);
    closeDeleteModal();
  };

  const handleExportCSV = () => {
    if (userArray.length === 0) return;
    const headers = Object.keys(userArray[0]);
    const rows = [headers.join(',')];
    for (const u of userArray) {
      rows.push(
          headers
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              //@ts-expect-error
              .map((h) => JSON.stringify((u)[h] ?? ''))
              .join(',')
      );
    }
    const blob = new Blob([rows.join('\n')], {
      type: 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (userArray.length === 0) return;
    const blob = new Blob(
        [JSON.stringify(userArray, null, 2)],
        { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Loading users…</CardDescription>
          </CardHeader>
        </Card>
    );
  }
  if (isError) {
    return (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription className="text-red-500">
              {error?.message || 'Failed to load users.'}
            </CardDescription>
          </CardHeader>
        </Card>
    );
  }

  return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                All registered users in the system
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportCSV}
              >
                Export CSV
              </Button>
              <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportJSON}
              >
                Export JSON
              </Button>
              <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers()}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {sortedUsers.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No users found. Create one above!
              </div>
          ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left font-medium">Name</th>
                    <th className="p-2 text-left font-medium">Email</th>
                    <th className="p-2 text-left font-medium">
                      Created
                    </th>
                    <th className="p-2 text-left font-medium">
                      Actions
                    </th>
                  </tr>
                  </thead>
                  <tbody>
                  {sortedUsers.map((u) => (
                      <tr
                          key={u.id}
                          className="border-b hover:bg-gray-50"
                      >
                        <td className="p-2">{u.name}</td>
                        <td className="p-2">{u.email}</td>
                        <td className="p-2 text-sm text-gray-500">
                          {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString()
                              : 'N/A'}
                        </td>
                        <td className="flex gap-2 p-2">
                          <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => handleEdit(u.id)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                              size="icon"
                              variant="destructive"
                              className="h-7 w-7"
                              onClick={() => openDeleteModal(u)}
                              disabled={
                                  deleteUserStatus === 'pending' &&
                                  userToDelete?.id === u.id
                              }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          )}

          <EditUserModal
              userId={editingUserId}
              open={!!editingUserId}
              onClose={() => setEditingUserId(null)}
          />

          <Dialog
              open={showDeleteModal}
              onOpenChange={setShowDeleteModal}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete User</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete{' '}
                  <strong>{userToDelete?.name}</strong> (
                  <code>{userToDelete?.email}</code>)? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                    variant="outline"
                    onClick={closeDeleteModal}
                    disabled={deleteUserStatus === 'pending'}
                >
                  Cancel
                </Button>
                <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteUserStatus === 'pending'}
                >
                  {deleteUserStatus === 'pending'
                      ? 'Deleting…'
                      : 'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
  );
}
