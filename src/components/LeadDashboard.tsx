import React, { useState, useEffect } from 'react';
import { Download, Search, Users, RefreshCw, ChevronRight, X, Building, Phone, Calendar, MapPin, Heart, Mail, Pencil } from 'lucide-react';
import { Lead } from '../types';
import LeadCaptureForm from './LeadCaptureForm';

export default function LeadDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/leads');
      const data = await response.json();
      if (data.success) {
        setLeads(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleExport = () => {
    window.location.href = '/api/leads/export';
  };

  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.firstName.toLowerCase().includes(searchLower) ||
      lead.lastName.toLowerCase().includes(searchLower) ||
      lead.mobileNumber.includes(searchLower) ||
      lead.residentialAddress.toLowerCase().includes(searchLower) ||
      (lead.emailAddress && lead.emailAddress.toLowerCase().includes(searchLower)) ||
      (lead.companyName && lead.companyName.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-160px)]">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-800" />
            Lead Directory
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Manage and export your captured leads.</p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full sm:w-64 pl-9 pr-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-blue-800 text-sm transition-shadow"
            />
          </div>
          <button
            onClick={fetchLeads}
            className="p-2 text-zinc-500 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            disabled={leads.length === 0}
            className="flex items-center px-3 sm:px-4 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-lg text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 whitespace-nowrap"
          >
            <Download className="w-4 h-4 sm:mr-2 text-zinc-500" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-zinc-50/50 sm:bg-white">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <RefreshCw className="w-8 h-8 animate-spin mb-3 text-blue-600" />
            <p>Loading database...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500 px-4 text-center">
            <Users className="w-12 h-12 mb-3 text-zinc-300" />
            <p className="text-lg font-medium text-zinc-700">No leads found</p>
            <p className="text-sm mt-1">{searchTerm ? 'Try adjusting your search criteria.' : 'Start capturing leads to see them here.'}</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Simplified List */}
            <div className="sm:hidden flex flex-col divide-y divide-zinc-200">
              {filteredLeads.map((lead) => (
                <button 
                  key={lead.id} 
                  onClick={() => setSelectedLead(lead)}
                  className="flex items-center justify-between p-4 bg-white hover:bg-zinc-50 active:bg-zinc-100 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-bold text-lg">
                      {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold text-zinc-900 truncate">{lead.firstName} {lead.lastName}</p>
                      <p className="text-xs text-zinc-500 truncate flex items-center mt-0.5">
                        <Building className="w-3 h-3 mr-1" />
                        {lead.companyName || 'Independent'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                </button>
              ))}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden sm:block">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50 sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Partner Info
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Added On
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-zinc-200">
                  {filteredLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-bold">
                            {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-zinc-900">
                              {lead.firstName} {lead.lastName}
                            </div>
                            <div className="text-sm text-zinc-500">{lead.mobileNumber}</div>
                            {lead.emailAddress && (
                              <div className="text-xs text-zinc-400 mt-0.5">{lead.emailAddress}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-zinc-900">{lead.companyName || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-zinc-900 truncate max-w-[200px]" title={lead.residentialAddress}>
                          {lead.residentialAddress}
                        </div>
                        <div className="text-sm text-zinc-500">{lead.postalCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-zinc-900">{lead.partnerName || '-'}</div>
                        <div className="text-sm text-zinc-500">{lead.partnerPhone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                        {new Date(lead.createdAt!).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Lead Details Modal */}
      {selectedLead && !isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-blue-50/50">
              <h3 className="text-lg font-semibold text-zinc-900">Lead Profile</h3>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-zinc-400 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                  title="Edit Lead"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
                  title="Close Profile"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-bold text-2xl border-2 border-white shadow-sm flex-shrink-0">
                  {selectedLead.firstName.charAt(0)}{selectedLead.lastName.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <h2 className="text-2xl font-bold text-zinc-900 truncate">{selectedLead.firstName} {selectedLead.lastName}</h2>
                  {selectedLead.companyName && (
                    <p className="text-blue-800 font-medium flex items-center mt-1">
                      <Building className="w-4 h-4 mr-1.5 flex-shrink-0" />
                      <span className="truncate">{selectedLead.companyName}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Main Contact Action Buttons */}
              <div className="flex space-x-3 mt-6 mb-8">
                {selectedLead.mobileNumber ? (
                  <a 
                    href={`tel:${selectedLead.mobileNumber}`} 
                    className="flex-1 flex items-center justify-center px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call {selectedLead.firstName}
                  </a>
                ) : (
                  <button 
                    disabled
                    className="flex-1 flex items-center justify-center px-4 py-2.5 bg-zinc-100 text-zinc-400 rounded-xl text-sm font-semibold cursor-not-allowed"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    No Phone
                  </button>
                )}

                {selectedLead.emailAddress ? (
                  <a 
                    href={`mailto:${selectedLead.emailAddress}`} 
                    className="flex-1 flex items-center justify-center px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl text-sm font-semibold transition-colors border border-blue-200"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email {selectedLead.firstName}
                  </a>
                ) : (
                  <button 
                    disabled
                    className="flex-1 flex items-center justify-center px-4 py-2.5 bg-zinc-50 text-zinc-400 rounded-xl text-sm font-semibold border border-zinc-200 cursor-not-allowed"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    No Email
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <section>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Contact Information</h4>
                  <div className="bg-zinc-50 rounded-xl p-4 space-y-4 border border-zinc-100">
                    <div className="flex items-start">
                      <Phone className="w-4 h-4 text-zinc-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{selectedLead.mobileNumber}</p>
                        <p className="text-xs text-zinc-500">Mobile</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Mail className="w-4 h-4 text-zinc-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-zinc-900 break-all">
                          {selectedLead.emailAddress || <span className="text-zinc-400 italic">Not provided</span>}
                        </p>
                        <p className="text-xs text-zinc-500">Email Address</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Calendar className="w-4 h-4 text-zinc-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{selectedLead.dob}</p>
                        <p className="text-xs text-zinc-500">Date of Birth</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 text-zinc-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{selectedLead.residentialAddress}</p>
                        <p className="text-xs text-zinc-500">Postal Code: {selectedLead.postalCode}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {selectedLead.partnerName && (
                  <section>
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center">
                      <Heart className="w-3.5 h-3.5 mr-1.5 text-pink-500" />
                      Partner Details
                    </h4>
                    <div className="bg-pink-50/40 rounded-xl p-4 space-y-4 border border-pink-100">
                      <div>
                        <p className="text-xs text-zinc-500 mb-0.5">Name</p>
                        <p className="text-sm font-medium text-zinc-900">{selectedLead.partnerName}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {selectedLead.partnerPhone && (
                          <div>
                            <p className="text-xs text-zinc-500 mb-1">Phone</p>
                            <a 
                              href={`tel:${selectedLead.partnerPhone}`} 
                              className="inline-flex items-center text-sm font-medium text-pink-700 hover:text-pink-800 bg-pink-100/50 px-2.5 py-1 rounded-md transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 mr-1.5" />
                              Call
                            </a>
                          </div>
                        )}
                        {selectedLead.partnerEmail && (
                          <div>
                            <p className="text-xs text-zinc-500 mb-1">Email</p>
                            <a 
                              href={`mailto:${selectedLead.partnerEmail}`} 
                              className="inline-flex items-center text-sm font-medium text-pink-700 hover:text-pink-800 bg-pink-100/50 px-2.5 py-1 rounded-md transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5 mr-1.5" />
                              Email
                            </a>
                          </div>
                        )}
                        {selectedLead.partnerDob && (
                          <div className="col-span-2">
                            <p className="text-xs text-zinc-500 mb-0.5">DOB</p>
                            <p className="text-sm font-medium text-zinc-900">{selectedLead.partnerDob}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                )}
                
                <p className="text-xs text-zinc-400 text-center pt-2">
                  Lead captured on {new Date(selectedLead.createdAt!).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {selectedLead && isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <LeadCaptureForm 
              initialData={selectedLead}
              onSuccess={() => {
                setIsEditing(false);
                setSelectedLead(null);
                fetchLeads();
              }}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
