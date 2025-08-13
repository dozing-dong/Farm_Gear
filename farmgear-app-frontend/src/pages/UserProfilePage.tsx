import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useUserProfile } from '../hooks/useUserProfile';
import { farmGearAPI, type UserProfileUpdateRequest } from '../lib/api';
import { useToast } from '../lib/toast';

function UserProfilePage() {
  const { showToast } = useToast();
  const { user, isLoading, updateUser } = useUserProfile();

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    lat: 0,
    lng: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Hook has handled redirection
  }

  // Edit mode toggle
  const handleEditToggle = () => {
    if (!isEditing) {
      setFormData({
        fullName: user.fullName,
        lat: user.lat || 0,
        lng: user.lng || 0,
      });
    }
    setIsEditing(!isEditing);
  };

  // Save user profile
  const handleSave = async () => {
    try {
      setIsSaving(true);

      const updateData: UserProfileUpdateRequest = {
        fullName: formData.fullName,
        lat: formData.lat,
        lng: formData.lng,
      };

      const response = await farmGearAPI.updateUserProfile(updateData);

      if (response.success && response.data) {
        updateUser(response.data);
        setIsEditing(false);

        showToast({
          type: 'success',
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
          duration: 3000,
        });
      } else {
        showToast({
          type: 'error',
          title: 'Update Failed',
          description: response.message || 'Failed to update profile.',
          duration: 5000,
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Update Failed',
        description: 'Failed to update profile. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return null; // Hook has handled redirection
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
              <p className="mt-2 text-gray-600">Manage your account settings and preferences</p>
            </div>
            <Button
              variant="outline"
              onClick={handleEditToggle}
              className="flex items-center gap-2"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Avatar */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName || user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-green-600 flex items-center justify-center text-white text-2xl font-bold">
                        {(user.fullName || user.username).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {user.fullName || user.username}
                  </h3>
                  <p className="text-sm text-gray-600">@{user.username}</p>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'Farmer'
                          ? 'bg-green-100 text-green-800'
                          : user.role === 'Provider'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="border-t pt-4">
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Member since</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Email verified</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {user.emailConfirmed ? (
                          <span className="text-green-600">Yes</span>
                        ) : (
                          <span className="text-red-600">No</span>
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Account status</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {user.isActive ? (
                          <span className="text-green-600">Active</span>
                        ) : (
                          <span className="text-red-600">Inactive</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <Input
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                        }
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Latitude
                        </label>
                        <Input
                          type="number"
                          step="0.000001"
                          value={formData.lat}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              lat: parseFloat(e.target.value) || 0,
                            }))
                          }
                          placeholder="Enter latitude"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Longitude
                        </label>
                        <Input
                          type="number"
                          step="0.000001"
                          value={formData.lng}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              lng: parseFloat(e.target.value) || 0,
                            }))
                          }
                          placeholder="Enter longitude"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary-600 hover:bg-primary-700"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <p className="text-gray-900">{user.email}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <p className="text-gray-900">{user.fullName}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <p className="text-gray-900">
                          {user.lat || user.lng ? `${user.lat || 0}, ${user.lng || 0}` : 'Not set'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Login
                        </label>
                        <p className="text-gray-900">
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;
