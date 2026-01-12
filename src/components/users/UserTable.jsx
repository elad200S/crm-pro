import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, UserX, UserCheck, Phone, Mail } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const statusColors = {
  "פעיל": "bg-green-100 text-green-800",
  "לא_פעיל": "bg-red-100 text-red-800",
  "השעיה": "bg-yellow-100 text-yellow-800"
};

const categoryColors = {
  "מנהל_ראשי": "bg-purple-100 text-purple-800",
  "מנהל_מחלקה": "bg-blue-100 text-blue-800",
  "איש_מכירות": "bg-green-100 text-green-800",
  "שירות_לקוחות": "bg-orange-100 text-orange-800",
  "מנהל_פרויקטים": "bg-indigo-100 text-indigo-800",
  "רו_ח_חשבונות": "bg-pink-100 text-pink-800",
  "צפייה_בלבד": "bg-gray-100 text-gray-800"
};

export default function UserTable({ users, loading, onEdit, onDeactivate, onActivate }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-right">שם מלא</TableHead>
                <TableHead className="text-right">תפקיד</TableHead>
                <TableHead className="text-right">מחלקה</TableHead>
                <TableHead className="text-right">קטגוריה</TableHead>
                <TableHead className="text-right">פרטי קשר</TableHead>
                <TableHead className="text-right">תאריך התחלה</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="font-semibold text-gray-900">{user.full_name}</div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{user.job_title}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{user.department}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={categoryColors[user.user_category]}>
                      {user.user_category?.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{user.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="truncate max-w-32">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {user.start_date ? format(new Date(user.start_date), "dd/MM/yyyy", { locale: he }) : "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[user.status]}>
                      {user.status?.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(user)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {user.status === "פעיל" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeactivate(user)}
                          className="text-orange-600 hover:text-orange-800"
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onActivate(user)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <UserCheck className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            לא נמצאו משתמשים
          </div>
        )}
      </CardContent>
    </Card>
  );
}