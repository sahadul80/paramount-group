// components/user/ProfileTab/EditMode.tsx
import React, { useRef } from 'react';
import { User } from '@/types/users';
import { FiUser, FiMail, FiBriefcase, FiDollarSign, FiUpload, FiCheckCircle, FiAlertCircle, FiTrash2 } from 'react-icons/fi';
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Label } from '../ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { motion } from 'framer-motion';
import EditSection from './EditSection';
import FormField from './FormField';
import { cn } from '@/app/lib/utils';

interface EditModeProps {
  profileData: User;
  currentUser: User;
  avatarPreview: string | null;
  avatarFile: File | null;
  phoneNumber: string;
  errors: Record<string, string>;
  isUploading: boolean;
  handleChange: (field: keyof User, value: string) => void;
  handlePhoneNumberChange: (value: string) => void;
  handleAvatarChange: (file: File) => void;
  handleSubmit: (e: React.FormEvent) => void;
  setShowDeleteModal: (show: boolean) => void;
  BANGLADESH_CODE: string;
}

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];

const EditMode: React.FC<EditModeProps> = ({
  profileData,
  currentUser,
  avatarPreview,
  avatarFile,
  phoneNumber,
  errors,
  isUploading,
  handleChange,
  handlePhoneNumberChange,
  handleAvatarChange,
  handleSubmit,
  setShowDeleteModal,
  BANGLADESH_CODE
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeInfoTab, setActiveInfoTab] = React.useState('personal');

  return (
    <motion.form
      key="edit"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      id="profile-form"
      className="space-y-6"
    >
      {/* Avatar Update Section */}
      <div className="flex flex-col items-center">
        <motion.div 
          className="relative group"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Avatar 
            className="w-28 h-28 md:w-36 md:h-36 border-4 border-background shadow-lg cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <AvatarImage 
              src={avatarPreview || currentUser.avatar || ''} 
              alt={profileData.username} 
              className="object-cover"
            />
            <AvatarFallback className="text-2xl bg-muted">
              {profileData.firstName?.charAt(0) || profileData.username.charAt(0)}
              {profileData.lastName?.charAt(0)}
            </AvatarFallback>
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <div className="bg-background p-2 rounded-full">
                <FiUpload className="text-foreground text-xl" />
              </div>
            </div>
          </Avatar>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAvatarChange(file);
            }}
            disabled={isUploading}
          />
        </motion.div>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          Click the avatar to change your profile photo
        </p>
        {avatarPreview && avatarFile && (
          <motion.p 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-1 text-xs text-success flex items-center gap-1"
          >
            <FiCheckCircle /> New image selected
          </motion.p>
        )}
      </div>

      {/* Editable Fields with Tabs for Mobile */}
      <div className="md:hidden">
        <Tabs defaultValue="personal">
          <TabsList className="grid grid-cols-3 w-full text-text border border-border">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="mt-2">
            <EditSection 
              title="Personal Information"
              icon={<FiUser />}
              fields={
                <>
                  <FormField 
                    label="First Name"
                    value={profileData.firstName || ''}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    disabled={isUploading}
                    error={errors.firstName}
                    required
                  />
                  <FormField 
                    label="Last Name"
                    value={profileData.lastName || ''}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    disabled={isUploading}
                    error={errors.lastName}
                    required
                  />
                  <FormField 
                    label="Date of Birth"
                    type="date"
                    value={profileData.dob || ''}
                    onChange={(e) => handleChange('dob', e.target.value)}
                    disabled={isUploading}
                    error={errors.dob}
                    tip="Format: YYYY-MM-DD"
                  />
                  <div className="flex flex-cols-2">
                    <Label className="text-foreground w-30 p-2">
                      Blood Group
                    </Label>
                    <div className="flex flex-col">
                      <Select
                        value={profileData.bloodGroup || ''}
                        onValueChange={(value: string) => handleChange('bloodGroup', value)}
                        disabled={isUploading}
                      >
                        <SelectTrigger className="bg-background border-border h-8 w-auto">
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent>
                          {bloodGroups.map(group => (
                            <SelectItem key={group} value={group}>
                              {group}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-cols-2">
                    <Label className="text-foreground w-30 p-2">
                      Gender
                    </Label>
                    <div className="flex flex-col">
                      <Select
                        value={profileData.gender || ''}
                        onValueChange={(value: string) => handleChange('gender', value)}
                        disabled={isUploading}
                      >
                        <SelectTrigger className="bg-background border-border h-8 w-auto">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {genders.map(gender => (
                            <SelectItem key={gender} value={gender}>
                              {gender}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              }
            />
          </TabsContent>
          
          <TabsContent value="contact" className="mt-2">
            <EditSection 
              title="Contact Information"
              icon={<FiMail />}
              fields={
                <>
                  <FormField 
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    disabled={isUploading}
                    error={errors.email}
                    required
                    tip="Must be a valid email address"
                  />
                  <div className="flex flex-cols-2">
                    <Label className="text-foreground w-30 p-2">
                      Phone
                    </Label>
                    <div className="flex flex-col">
                      <div className="flex">
                        <div className={cn("flex items-center bg-background px-2 border-border rounded-lg text-foreground")}>
                          {BANGLADESH_CODE}
                        </div>
                        <Input
                          value={phoneNumber}
                          onChange={(e) => handlePhoneNumberChange(e.target.value)}
                          placeholder="1234567890"
                          disabled={isUploading}
                          className={cn(
                            "bg-background border-border h-8 w-36 rounded-l-none",
                            errors.phone && "border-destructive"
                          )}
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-destructive text-sm flex items-center gap-1">
                          <FiAlertCircle className="w-4 h-4" /> {errors.phone}
                        </p>
                      )}
                      <p className="text-muted-foreground text-xs">
                        Format: {BANGLADESH_CODE} followed by 10 digits
                      </p>
                    </div>
                  </div>
                  <FormField 
                    label="Address"
                    value={profileData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    disabled={isUploading}
                  />
                </>
              }
            />
          </TabsContent>
          
          <TabsContent value="account" className="mt-2">
            <EditSection 
              title="Account Information"
              icon={<FiDollarSign />}
              fields={
                <>
                  <FormField 
                    label="Username"
                    value={profileData.username}
                    disabled={true}
                  />
                  <FormField 
                    label="Role"
                    value={profileData.role}
                    disabled={true}
                  />
                  <FormField 
                    label="Status"
                    value={getStatusString(profileData.status)}
                    disabled={true}
                  />
                  
                  {/* Delete Account Button */}
                  <div className="pt-4 mt-4 border-t border-border">
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => setShowDeleteModal(true)}
                      disabled={isUploading}
                      type="button"
                    >
                      <FiTrash2 className="mr-2" /> Delete My Account
                    </Button>
                    <p className="mt-2 text-xs text-destructive text-center">
                      Warning: This action is irreversible
                    </p>
                  </div>
                </>
              }
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Edit Form */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-2 gap-2">
        <EditSection 
          title="Personal Information"
          icon={<FiUser />}
          fields={
            <>
              <FormField 
                label="First Name"
                value={profileData.firstName || ''}
                onChange={(e) => handleChange('firstName', e.target.value)}
                disabled={isUploading}
                error={errors.firstName}
                required
              />
              <FormField 
                label="Last Name"
                value={profileData.lastName || ''}
                onChange={(e) => handleChange('lastName', e.target.value)}
                disabled={isUploading}
                error={errors.lastName}
                required
              />
              <FormField 
                label="Date of Birth"
                type="date"
                value={profileData.dob || ''}
                onChange={(e) => handleChange('dob', e.target.value)}
                disabled={isUploading}
                error={errors.dob}
                tip="Format: YYYY-MM-DD"
              />
              <div className="flex flex-cols-2">
                <Label className="text-foreground w-30 p-2">
                  Blood Group
                </Label>
                <div className="flex flex-col">
                  <Select
                    value={profileData.bloodGroup || ''}
                    onValueChange={(value: string) => handleChange('bloodGroup', value)}
                    disabled={isUploading}
                  >
                    <SelectTrigger className="bg-background border-border h-8 w-auto">
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodGroups.map(group => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-cols-2">
                <Label className="text-foreground w-30 p-2">
                  Gender
                </Label>
                <div className="flex flex-col">
                  <Select
                    value={profileData.gender || ''}
                    onValueChange={(value: string) => handleChange('gender', value)}
                    disabled={isUploading}
                  >
                    <SelectTrigger className="bg-background border-border h-8 w-auto">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {genders.map(gender => (
                        <SelectItem key={gender} value={gender}>
                          {gender}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          }
        />
        
        <EditSection 
          title="Contact Information"
          icon={<FiMail />}
          fields={
            <>
              <FormField 
                label="Email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={isUploading}
                error={errors.email}
                required
                tip="Must be a valid email address"
              />
              <div className="flex flex-cols-2">
                <Label className="text-foreground w-30 p-2">
                  Phone
                </Label>
                <div className="flex flex-col">
                  <div className="flex">
                    <div className="flex items-center px-2 bg-background border border-border border-r-0 rounded-l-md text-foreground">
                      {BANGLADESH_CODE}
                    </div>
                    <Input
                      value={phoneNumber}
                      onChange={(e) => handlePhoneNumberChange(e.target.value)}
                      placeholder="1XXXXXXXXX"
                      disabled={isUploading}
                      className={"border border-border border-r-none"+cn(
                        "bg-background h-8 w-36 rounded-md",
                        errors.phone && "border-destructive"
                      )}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-destructive text-sm flex items-center gap-1">
                      <FiAlertCircle className="w-4 h-4" /> {errors.phone}
                    </p>
                  )}
                  <p className="text-muted-foreground text-xs">
                    Format: {BANGLADESH_CODE} followed by 10 digits
                  </p>
                </div>
              </div>
              <FormField 
                label="Address"
                value={profileData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                disabled={isUploading}
              />
            </>
          }
        />
        
        <EditSection 
          title="Employment Details"
          icon={<FiBriefcase />}
          fields={
            <>
              <FormField 
                label="Employee ID"
                value={profileData.employeeId || ''}
                disabled={true}
                tip="Contact admin to change"
              />
              <FormField 
                label="Position"
                value={profileData.position || ''}
                disabled={true}
                tip="Contact admin to change"
              />
              <FormField 
                label="Department"
                value={profileData.department || ''}
                disabled={true}
                tip="Contact admin to change"
              />
              <FormField 
                label="Salary"
                value={profileData.salary || ''}
                disabled={true}
                tip="Contact admin to change"
              />
            </>
          }
        />
        
        <EditSection 
          title="Account Information"
          icon={<FiDollarSign />}
          fields={
            <>
              <FormField 
                label="Username"
                value={profileData.username}
                disabled={true}
              />
              <FormField 
                label="Role"
                value={profileData.role}
                disabled={true}
              />
              <FormField 
                label="Status"
                value={getStatusString(profileData.status)}
                disabled={true}
              />
              
              {/* Delete Account Button */}
              <div className="pt-4 mt-4 border-t border-border">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={isUploading}
                  type="button"
                >
                  <FiTrash2 className="mr-2" /> Delete My Account
                </Button>
                <p className="mt-2 text-xs text-destructive text-center">
                  Warning: This action is irreversible and will permanently delete your account
                </p>
              </div>
            </>
          }
        />
      </div>
    </motion.form>
  );
};

// Helper function
const getStatusString = (status: number) => {
  switch (status) {
    case 0: return 'Inactive';
    case 1: return 'Pending';
    case 2: return 'Onboarded';
    case 3: return 'Away';
    case 4: return 'Offline';
    case 5: return 'Online';
    default: return 'Unknown';
  }
};

export default EditMode;