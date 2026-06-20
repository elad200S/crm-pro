import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
const { Customer } = base44.entities;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download } from "lucide-react";
import { useLocation } from "react-router-dom";
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

import CustomerForm from "../components/customers/CustomerForm";
import CustomerTable from "../components/customers/CustomerTable";
import CustomerFilters from "../components/customers/CustomerFilters";
import CustomerCard from "../components/customers/CustomerCard";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "הכל",
    source: "הכל"
  });
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const exportToCSV = () => {
    const headers = ["שם פרטי", "שם משפחה", "טלפון", "אימייל", "חברה", "סטטוס", "מקור הגעה", "עיר", "תאריך רישום"];
    const rows = filteredCustomers.map(c => [
      c.first_name || "", c.last_name || "", c.phone || "", c.email || "",
      c.company || "", c.status || "", c.source || "", c.city || "",
      c.registration_date || c.created_date || ""
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "לקוחות.csv"; a.click();
    URL.revokeObjectURL(url);
  };
  
  const location = useLocation();

  const filterCustomers = useCallback(() => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
      );
    }

    if (filters.status !== "הכל") {
      filtered = filtered.filter(customer => customer.status === filters.status);
    }

    if (filters.source !== "הכל") {
      filtered = filtered.filter(customer => customer.source === filters.source);
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, filters]);

  const loadCustomers = useCallback(async () => {
    try {
      const data = await Customer.list('-created_date');
      setCustomers(data);
    } catch (error) {
      console.error("שגיאה בטעינת לקוחות:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const initializeData = useCallback(async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      await loadCustomers();
    } catch (error) {
      console.error("שגיאה באתחול:", error);
      setLoading(false);
    }
  }, [loadCustomers]);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  useEffect(() => {
    filterCustomers();
  }, [filterCustomers]);

  // בדיקה אם הגענו מהדשבורד עם לקוח לעריכה
  useEffect(() => {
    if (location.state?.editCustomer) {
      setEditingCustomer(location.state.editCustomer);
      setShowForm(true);
      // נקה את ה-state כדי שלא יפתח שוב
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (customerData) => {
    try {
      if (editingCustomer) {
        // בדיקת הרשאה לעריכה
        if (editingCustomer.created_by !== currentUser.email && currentUser?.role !== 'admin') {
          alert("אין לך הרשאה לערוך לקוח זה");
          return;
        }
        await Customer.update(editingCustomer.id, customerData);
      } else {
        await Customer.create({
          ...customerData,
          registration_date: customerData.registration_date || new Date().toISOString().split('T')[0]
        });
      }
      setShowForm(false);
      setEditingCustomer(null);
      loadCustomers();
    } catch (error) {
      console.error("שגיאה בשמירת לקוח:", error);
    }
  };

  const handleEdit = (customer) => {
    if (customer.created_by !== currentUser.email && currentUser?.role !== 'admin') {
      alert("אין לך הרשאה לערוך לקוח זה");
      return;
    }
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleDeleteClick = (customer) => {
    if (customer.created_by !== currentUser.email && currentUser?.role !== 'admin') {
      alert("אין לך הרשאה למחוק לקוח זה");
      return;
    }
    setCustomerToDelete(customer);
  };

  const confirmDelete = async () => {
    if (customerToDelete) {
      try {
        await Customer.delete(customerToDelete.id);
        setCustomerToDelete(null);
        loadCustomers();
      } catch (error) {
        console.error("שגיאה במחיקת לקוח:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ניהול לקוחות</h1>
            <p className="text-gray-600">
              {filteredCustomers.length} לקוחות מתוך {customers.length} סה"כ
              {currentUser?.role !== 'admin' && " (הלקוחות שלך בלבד)"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 ml-2" />
              ייצוא לאקסל
            </Button>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 shadow-md"
            >
              <Plus className="w-5 h-5 ml-2" />
              לקוח חדש
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="חיפוש לפי שם, אימייל או טלפון..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <CustomerFilters filters={filters} setFilters={setFilters} />
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingCustomer(null);
          }}
        />
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm">
        <CustomerTable
          customers={filteredCustomers}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          isAdmin={currentUser?.role === 'admin'}
          onRowClick={setSelectedCustomer}
        />
      </div>

      {selectedCustomer && (
        <CustomerCard
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onEdit={(c) => { handleEdit(c); setSelectedCustomer(null); }}
          onDelete={(c) => { handleDeleteClick(c); setSelectedCustomer(null); }}
          currentUser={currentUser}
          onUpdate={loadCustomers}
        />
      )}

      <AlertDialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הלקוח "{customerToDelete?.first_name} {customerToDelete?.last_name}"? פעולה זו הינה בלתי הפיכה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}