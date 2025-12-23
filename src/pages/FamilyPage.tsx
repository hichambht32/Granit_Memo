import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, LogOut, Copy, Check, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Label } from "../components/ui/Label";
import { Badge } from "../components/ui/Badge";
import { useAuth } from "../store/AuthContext";

export function FamilyPage() {
  const { user, family, createFamily, joinFamily, leaveFamily } = useAuth();
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      alert("Please enter a family name");
      return;
    }

    const code = await createFamily(familyName.trim());
    setFamilyName("");
    setShowCreateForm(false);
    alert(`Family created! Invite code: ${code}`);
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) {
      alert("Please enter an invite code");
      return;
    }

    const success = await joinFamily(inviteCode.trim().toUpperCase());
    if (success) {
      setInviteCode("");
      setShowJoinForm(false);
    }
  };

  const handleCopyInviteCode = () => {
    if (family?.inviteCode) {
      navigator.clipboard.writeText(family.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeaveFamily = () => {
    if (confirm("Are you sure you want to leave this family?")) {
      leaveFamily();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-4 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2 text-gray-900 dark:text-gray-100">Family & Team</h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          Collaborate and share knowledge with your family or team
        </p>
      </div>

      {family ? (
        <>
          {/* Current Family */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    {family.name}
                  </CardTitle>
                  <CardDescription className="text-blue-700 dark:text-blue-300">
                    {family.members.length} member{family.members.length !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLeaveFamily}
                  className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Invite Code */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Invite Code
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={family.inviteCode}
                    readOnly
                    className="font-mono text-lg"
                  />
                  <Button
                    onClick={handleCopyInviteCode}
                    variant="outline"
                    size="icon"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Share this code with others to invite them to your family
                </p>
              </div>

              {/* Members List */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                  Members
                </Label>
                <div className="space-y-2">
                  {family.members.map((member) => (
                    <motion.div
                      key={member.userId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {member.userName}
                          </p>
                          {member.role === "owner" && (
                            <Badge variant="secondary" className="text-xs">
                              Owner
                            </Badge>
                          )}
                          {member.userId === user.id && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {member.userEmail}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* No Family - Show Options */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Create Family */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-green-900 dark:text-green-100">
                  Create a Family
                </CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">
                  Start a new learning group
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showCreateForm ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="family-name">Family Name</Label>
                      <Input
                        id="family-name"
                        value={familyName}
                        onChange={(e) => setFamilyName(e.target.value)}
                        placeholder="The Smith Family"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCreateFamily}
                        className="flex-1"
                        size="lg"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create
                      </Button>
                      <Button
                        onClick={() => {
                          setShowCreateForm(false);
                          setFamilyName("");
                        }}
                        variant="outline"
                        size="lg"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full"
                    size="lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Family
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Join Family */}
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="text-purple-900 dark:text-purple-100">
                  Join a Family
                </CardTitle>
                <CardDescription className="text-purple-700 dark:text-purple-300">
                  Enter an invite code
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showJoinForm ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="invite-code">Invite Code</Label>
                      <Input
                        id="invite-code"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="ABC12345"
                        className="mt-1 font-mono"
                        maxLength={8}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleJoinFamily}
                        className="flex-1"
                        size="lg"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Join
                      </Button>
                      <Button
                        onClick={() => {
                          setShowJoinForm(false);
                          setInviteCode("");
                        }}
                        variant="outline"
                        size="lg"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowJoinForm(true)}
                    className="w-full"
                    size="lg"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Family
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <Users className="w-8 h-8 text-blue-500 shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Why create or join a family?
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>Share knowledge and learning materials with your team</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>Collaborate on quiz questions and study together</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>Track collective progress and celebrate achievements</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
