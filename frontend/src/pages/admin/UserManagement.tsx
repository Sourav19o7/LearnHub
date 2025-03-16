import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import LoadingScreen from '../../components/common/LoadingScreen';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import {
  UserCircleIcon,
  UserPlusIcon,
  UserMinusIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  role: 'student' | 'instructor' | 'admin';
  status: 'active' | 'inactive';
  created_at: string;
}

interface UserFormValues {
  first_name: string;
  last_name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  password?: string;
}

const userSchema = Yup.object().shape({
    first_name: Yup.string().required('First name is required'),
    last_name: Yup.string().required('Last name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    role: Yup.string()
      .oneOf(['student', 'instructor', 'admin'], 'Invalid role')
      .required('Role is required'),
    password: Yup.string().when('isEditing', (isEditing, schema) => {
      return isEditing 
        ? schema 
        : schema.required('Password is required').min(8, 'Password must be at least 8 characters');
    }),
  });

const UserManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  // Fetch users
  const { data, isLoading, error } = useQuery(
    ['users', searchTerm, selectedRole, selectedStatus, sortBy, sortOrder],
    async () => {
      const params: any = {
        sortBy,
        sortOrder,
      };
      
      if (searchTerm) params.search = searchTerm;
      if (selectedRole !== 'all') params.role = selectedRole;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      
      const response = await api.get('/admin/users', { params });
      return response.data;
    }
  );

  // Create user mutation
  const createUser = useMutation(
    async (values: UserFormValues) => {
      return await api.post('/admin/users', values);
    },
    {
      onSuccess: () => {
        toast.success('User created successfully');
        setShowAddUserForm(false);
        queryClient.invalidateQueries(['users']);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create user');
      },
    }
  );

  // Update user mutation
  const updateUser = useMutation(
    async ({ userId, values }: { userId: string; values: Partial<UserFormValues> }) => {
      return await api.put(`/admin/users/${userId}`, values);
    },
    {
      onSuccess: () => {
        toast.success('User updated successfully');
        setUserToEdit(null);
        queryClient.invalidateQueries(['users']);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update user');
      },
    }
  );

  // Toggle user status mutation
  const toggleUserStatus = useMutation(
    async ({ userId, status }: { userId: string; status: 'active' | 'inactive' }) => {
      return await api.put(`/admin/users/${userId}/status`, { status });
    },
    {
      onSuccess: () => {
        toast.success('User status updated successfully');
        queryClient.invalidateQueries(['users']);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update user status');
      },
    }
  );

  // Handle role changes
  const handleRoleChange = useMutation(
    async ({ userId, role }: { userId: string; role: 'student' | 'instructor' | 'admin' }) => {
      return await api.put(`/admin/users/${userId}/role`, { role });
    },
    {
      onSuccess: () => {
        toast.success('User role updated successfully');
        queryClient.invalidateQueries(['users']);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update user role');
      },
    }
  );

  // Handle adding a new user
  const handleAddUser = (values: UserFormValues, { setSubmitting }: any) => {
    createUser.mutate(values);
    setSubmitting(false);
  };

  // Handle editing a user
  const handleEditUser = (values: Partial<UserFormValues>, { setSubmitting }: any) => {
    if (!userToEdit) return;
    
    updateUser.mutate({
      userId: userToEdit.id,
      values: {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        role: values.role,
        ...(values.password ? { password: values.password } : {}),
      },
    });
    
    setSubmitting(false);
  };

  // Handle sorting
  const handleSort = (field: 'name' | 'email' | 'role' | 'created_at') => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending order
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
            Error Loading Users
          </h2>
          <p className="text-surface-600 dark:text-surface-400">
            An error occurred while loading users. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const users: User[] = data?.data || [];

  // Apply frontend filtering (in a real app, filtering would likely be done on the backend)
  const filteredUsers = users.filter((user) => {
    const nameMatch = `${user.first_name} ${user.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const emailMatch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const roleMatch = selectedRole === 'all' || user.role === selectedRole;
    const statusMatch = selectedStatus === 'all' || user.status === selectedStatus;
    
    return (nameMatch || emailMatch) && roleMatch && statusMatch;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            User Management
          </h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            Manage platform users
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => {
              setShowAddUserForm(true);
              setUserToEdit(null);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Filters and search */}
      <div className="bg-white dark:bg-surface-800 shadow-sm dark:shadow-dark-sm rounded-lg overflow-hidden mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-surface-400 dark:text-surface-500" />
              </div>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center">
                <span className="mr-2 text-sm font-medium text-surface-700 dark:text-surface-300">
                  <FunnelIcon className="h-5 w-5 inline-block mr-1" />
                  Role:
                </span>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="instructor">Instructors</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
              <div className="flex items-center">
                <span className="mr-2 text-sm font-medium text-surface-700 dark:text-surface-300">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit User Form */}
      {(showAddUserForm || userToEdit) && (
        <div className="bg-white dark:bg-surface-800 shadow-sm dark:shadow-dark-sm rounded-lg overflow-hidden mb-6">
          <div className="p-4 bg-surface-50 dark:bg-surface-850 border-b border-surface-200 dark:border-surface-700 flex justify-between items-center">
            <h2 className="text-lg font-medium text-surface-900 dark:text-white">
              {userToEdit ? 'Edit User' : 'Add New User'}
            </h2>
            <button
              onClick={() => {
                setShowAddUserForm(false);
                setUserToEdit(null);
              }}
              className="text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            <Formik
              initialValues={{
                first_name: userToEdit?.first_name || '',
                last_name: userToEdit?.last_name || '',
                email: userToEdit?.email || '',
                role: userToEdit?.role || 'student',
                password: '',
                isEditing: !!userToEdit,
              }}
              validationSchema={userSchema}
              onSubmit={userToEdit ? handleEditUser : handleAddUser}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="first_name"
                        className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                      >
                        First name
                      </label>
                      <div className="mt-1">
                        <Field
                          id="first_name"
                          name="first_name"
                          type="text"
                          className="appearance-none block w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                        />
                        <ErrorMessage
                          name="first_name"
                          component="p"
                          className="mt-2 text-sm text-error-600 dark:text-error-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="last_name"
                        className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                      >
                        Last name
                      </label>
                      <div className="mt-1">
                        <Field
                          id="last_name"
                          name="last_name"
                          type="text"
                          className="appearance-none block w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                        />
                        <ErrorMessage
                          name="last_name"
                          component="p"
                          className="mt-2 text-sm text-error-600 dark:text-error-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                      >
                        Email
                      </label>
                      <div className="mt-1">
                        <Field
                          id="email"
                          name="email"
                          type="email"
                          className="appearance-none block w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                        />
                        <ErrorMessage
                          name="email"
                          component="p"
                          className="mt-2 text-sm text-error-600 dark:text-error-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="role"
                        className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                      >
                        Role
                      </label>
                      <div className="mt-1">
                        <Field
                          as="select"
                          id="role"
                          name="role"
                          className="appearance-none block w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                        >
                          <option value="student">Student</option>
                          <option value="instructor">Instructor</option>
                          <option value="admin">Admin</option>
                        </Field>
                        <ErrorMessage
                          name="role"
                          component="p"
                          className="mt-2 text-sm text-error-600 dark:text-error-400"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-surface-700 dark:text-surface-300"
                      >
                        {userToEdit ? 'New Password (leave blank to keep current)' : 'Password'}
                      </label>
                      <div className="mt-1">
                        <Field
                          id="password"
                          name="password"
                          type="password"
                          className="appearance-none block w-full px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                        />
                        <ErrorMessage
                          name="password"
                          component="p"
                          className="mt-2 text-sm text-error-600 dark:text-error-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddUserForm(false);
                        setUserToEdit(null);
                      }}
                      className="px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-md shadow-sm text-sm font-medium text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting
                        ? userToEdit
                          ? 'Saving...'
                          : 'Creating...'
                        : userToEdit
                        ? 'Save Changes'
                        : 'Create User'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white dark:bg-surface-800 shadow-sm dark:shadow-dark-sm rounded-lg overflow-hidden">
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-700">
              <thead className="bg-surface-50 dark:bg-surface-850">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      <span>User</span>
                      {sortBy === 'name' && (
                        sortOrder === 'asc' ? (
                          <ArrowUpCircleIcon className="h-4 w-4 ml-1" />
                        ) : (
                          <ArrowDownCircleIcon className="h-4 w-4 ml-1" />
                        )
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center">
                      <span>Email</span>
                      {sortBy === 'email' && (
                        sortOrder === 'asc' ? (
                          <ArrowUpCircleIcon className="h-4 w-4 ml-1" />
                        ) : (
                          <ArrowDownCircleIcon className="h-4 w-4 ml-1" />
                        )
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center">
                      <span>Role</span>
                      {sortBy === 'role' && (
                        sortOrder === 'asc' ? (
                          <ArrowUpCircleIcon className="h-4 w-4 ml-1" />
                        ) : (
                          <ArrowDownCircleIcon className="h-4 w-4 ml-1" />
                        )
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center">
                      <span>Created</span>
                      {sortBy === 'created_at' && (
                        sortOrder === 'asc' ? (
                          <ArrowUpCircleIcon className="h-4 w-4 ml-1" />
                        ) : (
                          <ArrowDownCircleIcon className="h-4 w-4 ml-1" />
                        )
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-surface-800 divide-y divide-surface-200 dark:divide-surface-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-50 dark:hover:bg-surface-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={`${user.first_name} ${user.last_name}`}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <UserCircleIcon className="h-10 w-10 text-surface-500 dark:text-surface-400" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-surface-900 dark:text-white">
                            {user.first_name} {user.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => {
                          const newRole = e.target.value as 'student' | 'instructor' | 'admin';
                          if (window.confirm(`Change ${user.first_name}'s role to ${newRole}?`)) {
                            handleRoleChange.mutate({ userId: user.id, role: newRole });
                          }
                        }}
                        className="text-sm px-2 py-1 border border-surface-300 dark:border-surface-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-surface-800 dark:text-white"
                      >
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'active'
                            ? 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300'
                            : 'bg-error-100 text-error-800 dark:bg-error-900/50 dark:text-error-300'
                        }`}
                      >
                        {user.status === 'active' ? (
                          <>
                            <CheckIcon className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XMarkIcon className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setUserToEdit(user)}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 mr-4"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          const newStatus = user.status === 'active' ? 'inactive' : 'active';
                          if (window.confirm(`${user.status === 'active' ? 'Deactivate' : 'Activate'} this user account?`)) {
                            toggleUserStatus.mutate({ userId: user.id, status: newStatus as 'active' | 'inactive' });
                          }
                        }}
                        className={`${
                          user.status === 'active'
                            ? 'text-error-600 dark:text-error-400 hover:text-error-900 dark:hover:text-error-300'
                            : 'text-success-600 dark:text-success-400 hover:text-success-900 dark:hover:text-success-300'
                        }`}
                      >
                        {user.status === 'active' ? (
                          <UserMinusIcon className="h-5 w-5" />
                        ) : (
                          <UserPlusIcon className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <UserCircleIcon className="h-12 w-12 mx-auto text-surface-400 dark:text-surface-500" />
            <h3 className="mt-4 text-lg font-medium text-surface-900 dark:text-white">
              No users found
            </h3>
            <p className="mt-2 text-surface-600 dark:text-surface-400">
              {searchTerm || selectedRole !== 'all' || selectedStatus !== 'all'
                ? 'No users match your filters. Try adjusting your search or filters.'
                : 'There are no users in the system yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;