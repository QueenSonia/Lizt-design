/* eslint-disable */
import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Settings,
  MoreHorizontal,
  Crown,
  Wrench,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { toast } from "sonner";
import { useInviteCollaboratorMutation } from "@/services/users/mutation";
import { useFetchTeamMembers } from "@/services/users/query";
import { TeamMember } from "@/types/team";
import { normalizePhoneNumber } from "@/utils/phoneNormalization";
// Mock team data
const mockTeamData = [
  {
    id: 1,
    name: "John Kennedy",
    email: "john@propertykraft.com",
    role: "Admin",
    status: "Active",
    joinDate: "2024-01-15",
    avatar: "JK",
    permissions: {
      canSubmitServiceRequests: true,
      canViewTenants: true,
      canEditProperties: true,
      canManageTeam: true,
      canViewReports: true,
    },
  },
  {
    id: 2,
    name: "Sarah Manager",
    email: "sarah@propertykraft.com",
    role: "Facility Manager",
    status: "Active",
    joinDate: "2024-02-01",
    avatar: "SM",
    permissions: {
      canSubmitServiceRequests: true,
      canViewTenants: true,
      canEditProperties: false,
      canManageTeam: false,
      canViewReports: true,
    },
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike@propertykraft.com",
    role: "Facility Manager",
    status: "Invited",
    joinDate: "2024-11-25",
    avatar: "MJ",
    permissions: {
      canSubmitServiceRequests: false,
      canViewTenants: true,
      canEditProperties: false,
      canManageTeam: false,
      canViewReports: false,
    },
  },
  {
    id: 4,
    name: "Lisa Chen",
    email: "lisa@propertykraft.com",
    role: "Facility Manager",
    status: "Revoked",
    joinDate: "2024-03-10",
    avatar: "LC",
    permissions: {
      canSubmitServiceRequests: false,
      canViewTenants: false,
      canEditProperties: false,
      canManageTeam: false,
      canViewReports: false,
    },
  },
];

interface TeamProps {
  searchTerm?: string;
  onMemberClick?: (memberId: number) => void;
}

export function Team({ searchTerm = "", onMemberClick }: TeamProps) {
  const { data: team } = useFetchTeamMembers();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    firstName: "",
    surname: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    if (team) setTeamMembers(team);
  }, [team]);

  // Filter team members based on search term(
  const filteredMembers = (team ?? []).filter(
    (member: any) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChange = (memberId: number, newRole: string) => {
    setTeamMembers((prev: any) =>
      prev.map((member: any) => {
        if (member.id === memberId) {
          // Update permissions based on role
          const updatedPermissions = { ...member.permissions };
          if (newRole === "Admin") {
            updatedPermissions.canManageTeam = true;
            updatedPermissions.canEditProperties = true;
            updatedPermissions.canViewReports = true;
          } else if (newRole === "Facility Manager") {
            updatedPermissions.canManageTeam = false;
            if (!member.permissions.canEditProperties) {
              updatedPermissions.canEditProperties = false;
            }
          }

          return {
            ...member,
            role: newRole,
            permissions: updatedPermissions,
          };
        }
        return member;
      })
    );
    toast.success(`Role updated to ${newRole}`);
  };

  const handleStatusChange = (memberId: number, newStatus: string) => {
    setTeamMembers((prev: any) =>
      prev.map((member: any) => {
        if (member.id === memberId) {
          return { ...member, status: newStatus };
        }
        return member;
      })
    );

    if (newStatus === "Revoked") {
      toast.success("Access revoked successfully");
    } else if (newStatus === "Active") {
      toast.success("Access restored successfully");
    }
  };

  const assignCollaborator = useInviteCollaboratorMutation();


  const handleInviteSubmit = async () => {
    if (
      !inviteForm.firstName ||
      !inviteForm.surname ||
      !inviteForm.email ||
      !inviteForm.phone
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    await assignCollaborator.mutateAsync({
      first_name: inviteForm.firstName,
      last_name: inviteForm.surname,
      email: inviteForm.email,
      phone_number: normalizePhoneNumber(inviteForm.phone),
      role: "facility_manager",
    });

    // setTeamMembers(prev => [...prev, newMember])
    setIsInviteModalOpen(false);
    setInviteForm({
      firstName: "",
      surname: "",
      phone: "",
      email: "",
    });
    toast.success("Invitation sent successfully!");
  };

  const getDefaultPermissions = (role: string) => {
    const defaultPermissions = {
      canSubmitServiceRequests: false,
      canViewTenants: true,
      canEditProperties: false,
      canManageTeam: false,
      canViewReports: false,
    };

    if (role === "Admin") {
      defaultPermissions.canSubmitServiceRequests = true;
      defaultPermissions.canEditProperties = true;
      defaultPermissions.canManageTeam = true;
      defaultPermissions.canViewReports = true;
    } else if (role === "Facility Manager") {
      defaultPermissions.canSubmitServiceRequests = true;
      defaultPermissions.canViewReports = true;
    }

    return defaultPermissions;
  };

  const handleRoleSelectChange = (role: string) => {
    setInviteForm((prev) => ({
      ...prev,
      role,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Team Management
          </h1>
          <p className="text-slate-600 mt-1">
            Manage team members and their permissions
          </p>
        </div>
        <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Collaborator
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-slate-900">
                Invite Collaborator
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Send an invitation to a new team member with their basic
                information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* First Name and Surname */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="text-sm font-medium text-slate-700"
                  >
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={inviteForm.firstName}
                    onChange={(e) =>
                      setInviteForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="surname"
                    className="text-sm font-medium text-slate-700"
                  >
                    Surname *
                  </Label>
                  <Input
                    id="surname"
                    type="text"
                    placeholder="Doe"
                    value={inviteForm.surname}
                    onChange={(e) =>
                      setInviteForm((prev) => ({
                        ...prev,
                        surname: e.target.value,
                      }))
                    }
                    className="w-full"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-sm font-medium text-slate-700"
                >
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+234 801 234 5678"
                  value={inviteForm.phone}
                  onChange={(e) =>
                    setInviteForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  className="w-full"
                />
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700"
                >
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="w-full"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInviteSubmit}
                  className="gradient-primary text-white"
                >
                  Send Invite
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members ({filteredMembers.length})
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {filteredMembers.map((member: any) => (
            <div
              key={member.id}
              className="p-6 hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => onMemberClick?.(member.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {member.name}
                  </h3>
                  <p className="text-sm text-slate-600">{member.email}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {member.role}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {filteredMembers.length === 0 && (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">
                {searchTerm
                  ? "No team members found matching your search."
                  : "No team members found."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
